/**
 * Minimal analytics event pipeline
 * Dev: in-memory storage
 * Prod: in-memory with periodic console logging (can upgrade to file/KV later)
 */

import { BUILD_SHA } from './build-headers'

export interface AnalyticsEvent {
  event: string
  timestamp: string
  build: string
  sessionId: string
  properties?: {
    audienceMode?: string
    confidenceBucket?: string
    reportId?: string
    [key: string]: string | number | boolean | undefined
  }
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

// In-memory event store (survives until server restart)
const eventStore: AnalyticsEvent[] = []
const MAX_EVENTS = 10000 // Keep last 10k events in memory

export function recordEvent(event: AnalyticsEvent): void {
  // Add to store
  eventStore.push(event)

  // Trim if over limit
  if (eventStore.length > MAX_EVENTS) {
    eventStore.splice(0, eventStore.length - MAX_EVENTS)
  }

  // In production, also log structured for potential log aggregation
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify({ type: 'analytics_event', ...event }))
  }
}

export function getEvents(options?: {
  since?: Date
  limit?: number
  eventName?: string
}): AnalyticsEvent[] {
  let filtered = [...eventStore]

  if (options?.since) {
    const sinceTime = options.since.getTime()
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= sinceTime)
  }

  if (options?.eventName) {
    filtered = filtered.filter((e) => e.event === options.eventName)
  }

  // Sort by timestamp descending (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit)
  }

  return filtered
}

export function getEventCounts(since?: Date): Record<EventName, number> {
  const events = getEvents({ since })
  const counts: Record<string, number> = {}

  for (const event of events) {
    counts[event.event] = (counts[event.event] || 0) + 1
  }

  return counts as Record<EventName, number>
}

export function getConversionRates(since?: Date): {
  homeToQuiz: number | null
  quizStartToComplete: number | null
  completeToResults: number | null
  resultsToEmail: number | null
  totalEvents: number
  periodLabel: string
} {
  const counts = getEventCounts(since)
  const totalEvents = getEvents({ since }).length

  const periodLabel = since
    ? `Since ${since.toISOString().split('T')[0]}`
    : 'All time (since deploy)'

  return {
    homeToQuiz: counts.view_home > 0 ? Math.round((counts.start_quiz / counts.view_home) * 100) : null,
    quizStartToComplete: counts.start_quiz > 0 ? Math.round((counts.complete_quiz / counts.start_quiz) * 100) : null,
    completeToResults: counts.complete_quiz > 0 ? Math.round((counts.view_results / counts.complete_quiz) * 100) : null,
    resultsToEmail: counts.view_results > 0 ? Math.round((counts.email_submitted / counts.view_results) * 100) : null,
    totalEvents,
    periodLabel,
  }
}

// Helper to generate anonymous session ID (client-side)
export function generateSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// Create event payload helper
export function createEventPayload(
  event: EventName,
  sessionId: string,
  properties?: AnalyticsEvent['properties']
): AnalyticsEvent {
  return {
    event,
    timestamp: new Date().toISOString(),
    build: BUILD_SHA,
    sessionId,
    properties,
  }
}
