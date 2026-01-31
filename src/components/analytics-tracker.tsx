'use client'

import { useEffect } from 'react'
import { trackEvent, getOrCreateSessionId } from '@/lib/analytics-client'
import type { EventName } from '@/lib/analytics'

interface AnalyticsTrackerProps {
  event: EventName
  properties?: Record<string, string | number | boolean | undefined>
}

/**
 * Client component that tracks an analytics event on mount
 * Use this in server components to fire page view events
 */
export function AnalyticsTracker({ event, properties }: AnalyticsTrackerProps) {
  useEffect(() => {
    // Ensure session ID exists
    getOrCreateSessionId()
    trackEvent(event, properties)
  }, [event, properties])

  return null
}

/**
 * Track click on sample report link
 */
export function SampleReportTracker({ children, className, href }: { children: React.ReactNode; className?: string; href: string }) {
  const handleClick = () => {
    trackEvent('sample_report_clicked')
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick}>
      {children}
    </a>
  )
}
