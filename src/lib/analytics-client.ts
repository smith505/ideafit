'use client'

import type { EventName } from './analytics'

const SESSION_KEY = 'ideafit-session-id'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

export async function trackEvent(
  event: EventName,
  properties?: Record<string, string | number | boolean | undefined>
): Promise<void> {
  const sessionId = getOrCreateSessionId()
  if (!sessionId) return

  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        sessionId,
        properties,
      }),
    })
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.debug('Analytics event failed:', error)
  }
}
