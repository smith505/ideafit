import { NextResponse } from 'next/server'
import { getBuildHeaders } from '@/lib/build-headers'
import { recordEvent, EventName } from '@/lib/analytics'
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
    ids: z.string().optional(),
  }).passthrough().optional(),
  // UTM params passed from client
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
})

export async function POST(request: Request) {
  const headers = getBuildHeaders()

  try {
    const body = await request.json()
    const validated = EventSchema.parse(body)

    // Extract referrer and user agent from request headers
    const referrer = request.headers.get('referer') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const result = await recordEvent({
      event: validated.event,
      sessionId: validated.sessionId,
      properties: validated.properties as Record<string, string | number | boolean | undefined>,
      utmSource: validated.utmSource,
      utmMedium: validated.utmMedium,
      utmCampaign: validated.utmCampaign,
      utmContent: validated.utmContent,
      utmTerm: validated.utmTerm,
      referrer,
      userAgent,
    })

    if (!result.success) {
      // Rate limited or database error - still return 200 to not break client
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'rate_limited' ? 429 : 500, headers }
      )
    }

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
