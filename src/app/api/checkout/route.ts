import { NextResponse } from 'next/server'
import { getStripe, REPORT_PRICE_CENTS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getBuildHeaders } from '@/lib/build-headers'
import { z } from 'zod'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'

const CheckoutSchema = z.object({
  reportId: z.string(),
  email: z.string().email(),
})

export async function POST(request: Request) {
  const headers = getBuildHeaders()

  try {
    const body = await request.json()
    const { reportId, email } = CheckoutSchema.parse(body)

    // Verify report exists
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { user: true },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404, headers })
    }

    // If already unlocked, redirect to report
    if (report.status === 'UNLOCKED') {
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/report/${reportId}`,
      }, { headers })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'IdeaFit Report',
              description:
                'Full validation report with competitor analysis, MVP spec, and 14-day ship plan',
            },
            unit_amount: REPORT_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: {
        reportId,
        userId: report.userId,
      },
      success_url: `${baseUrl}/report/${reportId}?success=true`,
      cancel_url: `${baseUrl}/preview/${reportId}?canceled=true`,
    })

    return NextResponse.json({ url: session.url }, { headers })
  } catch (error) {
    console.error('Checkout error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400, headers }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500, headers }
    )
  }
}
