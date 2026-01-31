import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe, REPORT_PRICE_CENTS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getBuildHeaders } from '@/lib/build-headers'
import Stripe from 'stripe'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const responseHeaders = getBuildHeaders()
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400, headers: responseHeaders })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: responseHeaders })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400, headers: responseHeaders })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const reportId = session.metadata?.reportId
    const userId = session.metadata?.userId

    if (!reportId || !userId) {
      console.error('Missing metadata in checkout session')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400, headers: responseHeaders })
    }

    try {
      // Create purchase record
      await prisma.purchase.create({
        data: {
          userId,
          reportId,
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          amount: REPORT_PRICE_CENTS,
          credits: 1,
        },
      })

      // Unlock report
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'UNLOCKED',
          unlockedAt: now,
          regensMax: 5,
          regensUsed: 0,
          regenExpiresAt: thirtyDaysFromNow,
        },
      })

      console.log(`Report ${reportId} unlocked for user ${userId}`)
    } catch (error) {
      console.error('Error processing payment:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500, headers: responseHeaders })
    }
  }

  return NextResponse.json({ received: true }, { headers: responseHeaders })
}
