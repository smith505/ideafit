'use client'

import type { EventName } from './analytics'

const SESSION_KEY = 'ideamatch-session-id'
const UTM_KEY = 'ideamatch-utm'

interface UtmParams {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

// Capture UTM params from URL on first visit and persist them
export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {}

  // Check if we already have UTM params stored
  const stored = localStorage.getItem(UTM_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as UtmParams
    } catch {
      // Invalid JSON, will re-capture
    }
  }

  // Capture from URL
  const params = new URLSearchParams(window.location.search)
  const utm: UtmParams = {}

  if (params.get('utm_source')) utm.utmSource = params.get('utm_source')!
  if (params.get('utm_medium')) utm.utmMedium = params.get('utm_medium')!
  if (params.get('utm_campaign')) utm.utmCampaign = params.get('utm_campaign')!
  if (params.get('utm_content')) utm.utmContent = params.get('utm_content')!
  if (params.get('utm_term')) utm.utmTerm = params.get('utm_term')!

  // Store for session persistence
  if (Object.keys(utm).length > 0) {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm))
  }

  return utm
}

export async function trackEvent(
  event: EventName,
  properties?: Record<string, string | number | boolean | undefined>
): Promise<void> {
  const sessionId = getOrCreateSessionId()
  if (!sessionId) return

  // Get UTM params (captures on first call, returns cached thereafter)
  const utm = captureUtmParams()

  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        sessionId,
        properties,
        ...utm,
      }),
    })
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.debug('Analytics event failed:', error)
  }
}
