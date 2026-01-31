import { NextResponse } from 'next/server'
import { getBuildHeaders } from '@/lib/build-headers'
import { recordEvent, AnalyticsEvent, EventName } from '@/lib/analytics'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const EventSchema = z.object({
  event: z.enum([
    'view_home',
    'start_quiz',
    'complete_quiz',
    'view_results',
    'click_save_results',
    'email_submitted',
    'preview_viewed',
    'sample_report_clicked',
    'compare_viewed',
  ] as const),
  sessionId: z.string().min(1),
  properties: z.object({
    audienceMode: z.string().optional(),
    confidenceBucket: z.string().optional(),
    reportId: z.string().optional(),
  }).passthrough().optional(),
})

export async function POST(request: Request) {
  const headers = getBuildHeaders()

  try {
    const body = await request.json()
    const validated = EventSchema.parse(body)

    const event: AnalyticsEvent = {
      event: validated.event,
      timestamp: new Date().toISOString(),
      build: headers['x-ideafit-build'],
      sessionId: validated.sessionId,
      properties: validated.properties as AnalyticsEvent['properties'],
    }

    recordEvent(event)

    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.issues },
        { status: 400, headers }
      )
    }

    console.error('Event recording error:', error)
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500, headers }
    )
  }
}
