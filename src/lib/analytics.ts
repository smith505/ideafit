/**
 * Analytics event pipeline with Postgres persistence
 * - Deduplication via dedupKey (event + sessionId + minute)
 * - Rate limiting per session
 * - UTM and referrer tracking
 */

import { prisma } from './prisma'
import { BUILD_SHA } from './build-headers'
import crypto from 'crypto'

export interface AnalyticsEventInput {
  event: string
  sessionId: string
  properties?: Record<string, string | number | boolean | undefined>
  // Tracking metadata (populated server-side from request headers)
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  referrer?: string
  userAgent?: string
}

export interface AnalyticsEvent {
  id: string
  event: string
  timestamp: string
  build: string
  sessionId: string
  properties?: Record<string, string | number | boolean | undefined>
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  referrer?: string | null
}

// Event types we track
export type EventName =
  | 'view_home'
  | 'start_quiz'
  | 'complete_quiz'
  | 'view_results'
  | 'click_save_results'
  | 'email_submitted'
  | 'preview_viewed'
  | 'sample_report_clicked'
  | 'compare_viewed'

// Rate limiting: max events per session per minute
const RATE_LIMIT_PER_SESSION = 30
const sessionEventCounts = new Map<string, { count: number; minute: number }>()

function getCurrentMinute(): number {
  return Math.floor(Date.now() / 60000)
}

function isRateLimited(sessionId: string): boolean {
  const currentMinute = getCurrentMinute()
  const entry = sessionEventCounts.get(sessionId)

  if (!entry || entry.minute !== currentMinute) {
    sessionEventCounts.set(sessionId, { count: 1, minute: currentMinute })
    return false
  }

  if (entry.count >= RATE_LIMIT_PER_SESSION) {
    return true
  }

  entry.count++
  return false
}

function generateDedupKey(event: string, sessionId: string): string {
  const minute = getCurrentMinute()
  const raw = `${event}:${sessionId}:${minute}`
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32)
}

export async function recordEvent(input: AnalyticsEventInput): Promise<{ success: boolean; error?: string }> {
  // Rate limit check (in-memory, always works)
  if (isRateLimited(input.sessionId)) {
    return { success: false, error: 'rate_limited' }
  }

  const dedupKey = generateDedupKey(input.event, input.sessionId)

  // Always log event for Railway log aggregation (backup)
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify({
      type: 'analytics_event',
      event: input.event,
      sessionId: input.sessionId,
      build: BUILD_SHA,
      utmSource: input.utmSource || null,
    }))
  }

  try {
    await prisma.analyticsEvent.create({
      data: {
        event: input.event,
        sessionId: input.sessionId,
        build: BUILD_SHA,
        properties: input.properties ? (input.properties as object) : undefined,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        referrer: input.referrer,
        userAgent: input.userAgent,
        dedupKey,
      },
    })

    return { success: true }
  } catch (error: unknown) {
    // Dedup key conflict = duplicate event, which is fine
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { success: true } // Already recorded, treat as success
    }

    // Log error with context but don't fail the request
    // Events were already logged above as backup
    console.error(JSON.stringify({
      type: 'analytics_error',
      event: input.event,
      build: BUILD_SHA,
      error: error instanceof Error ? error.message.slice(0, 100) : 'unknown',
    }))

    // Return success anyway - we logged to stdout as backup
    // This prevents analytics from blocking user experience
    return { success: true }
  }
}

export async function getEvents(options?: {
  since?: Date
  limit?: number
  eventName?: string
  sessionId?: string
  utmSource?: string
}): Promise<AnalyticsEvent[]> {
  const where: Record<string, unknown> = {}

  if (options?.since) {
    where.createdAt = { gte: options.since }
  }
  if (options?.eventName) {
    where.event = options.eventName
  }
  if (options?.sessionId) {
    where.sessionId = options.sessionId
  }
  if (options?.utmSource) {
    where.utmSource = options.utmSource
  }

  const events = await prisma.analyticsEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 1000,
  })

  return events.map((e) => ({
    id: e.id,
    event: e.event,
    timestamp: e.createdAt.toISOString(),
    build: e.build,
    sessionId: e.sessionId,
    properties: e.properties as Record<string, string | number | boolean | undefined> | undefined,
    utmSource: e.utmSource,
    utmMedium: e.utmMedium,
    utmCampaign: e.utmCampaign,
    utmContent: e.utmContent,
    utmTerm: e.utmTerm,
    referrer: e.referrer,
  }))
}

export async function getEventCounts(since?: Date): Promise<Record<EventName, number>> {
  const events = await getEvents({ since, limit: 100000 })
  const counts: Record<string, number> = {}

  for (const event of events) {
    counts[event.event] = (counts[event.event] || 0) + 1
  }

  return counts as Record<EventName, number>
}

export async function getConversionRates(since?: Date): Promise<{
  homeToQuiz: number | null
  quizStartToComplete: number | null
  completeToResults: number | null
  resultsToEmail: number | null
  totalEvents: number
  periodLabel: string
}> {
  const counts = await getEventCounts(since)
  const events = await getEvents({ since, limit: 100000 })
  const totalEvents = events.length

  const periodLabel = since
    ? `Since ${since.toISOString().split('T')[0]}`
    : 'All time'

  return {
    homeToQuiz: counts.view_home > 0 ? Math.round((counts.start_quiz / counts.view_home) * 100) : null,
    quizStartToComplete: counts.start_quiz > 0 ? Math.round((counts.complete_quiz / counts.start_quiz) * 100) : null,
    completeToResults: counts.complete_quiz > 0 ? Math.round((counts.view_results / counts.complete_quiz) * 100) : null,
    resultsToEmail: counts.view_results > 0 ? Math.round((counts.email_submitted / counts.view_results) * 100) : null,
    totalEvents,
    periodLabel,
  }
}

// Get unique sessions count
export async function getUniqueSessions(since?: Date): Promise<number> {
  const where: Record<string, unknown> = {}
  if (since) {
    where.createdAt = { gte: since }
  }

  const result = await prisma.analyticsEvent.groupBy({
    by: ['sessionId'],
    where,
  })

  return result.length
}

// Get UTM breakdown for attribution
export async function getUtmBreakdown(since?: Date): Promise<{
  bySource: Record<string, number>
  byMedium: Record<string, number>
  byCampaign: Record<string, number>
}> {
  const events = await getEvents({ since, limit: 100000 })

  const bySource: Record<string, number> = {}
  const byMedium: Record<string, number> = {}
  const byCampaign: Record<string, number> = {}

  for (const event of events) {
    const source = event.utmSource || '(direct)'
    const medium = event.utmMedium || '(none)'
    const campaign = event.utmCampaign || '(none)'

    bySource[source] = (bySource[source] || 0) + 1
    byMedium[medium] = (byMedium[medium] || 0) + 1
    byCampaign[campaign] = (byCampaign[campaign] || 0) + 1
  }

  return { bySource, byMedium, byCampaign }
}

// Export events as CSV
export async function exportEventsAsCsv(since?: Date): Promise<string> {
  const events = await getEvents({ since, limit: 100000 })

  const headers = ['id', 'event', 'timestamp', 'sessionId', 'build', 'utmSource', 'utmMedium', 'utmCampaign', 'referrer']
  const rows = events.map((e) => [
    e.id,
    e.event,
    e.timestamp,
    e.sessionId,
    e.build,
    e.utmSource || '',
    e.utmMedium || '',
    e.utmCampaign || '',
    e.referrer || '',
  ])

  return [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
}

// Helper to generate anonymous session ID (client-side compatible)
export function generateSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// Create event payload helper (for client-side)
export function createEventPayload(
  event: EventName,
  sessionId: string,
  properties?: AnalyticsEvent['properties']
): { event: string; sessionId: string; properties?: AnalyticsEvent['properties'] } {
  return {
    event,
    sessionId,
    properties,
  }
}
