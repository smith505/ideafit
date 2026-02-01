import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe, getStripeMode, getStripeWebhookSecret, REPORT_PRICE_CENTS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getBuildHeaders } from '@/lib/build-headers'
import { generateFullReport, AIIdea } from '@/lib/ai-ideas'
import { FitProfile } from '@/lib/fit-algorithm'
import { sendReportReadyEmail } from '@/lib/resend'
import Stripe from 'stripe'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const responseHeaders = getBuildHeaders()
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400, headers: responseHeaders })
  }

  let webhookSecret: string
  try {
    webhookSecret = getStripeWebhookSecret()
  } catch (error) {
    console.error('[Webhook] Webhook secret not configured:', error)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: responseHeaders })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400, headers: responseHeaders })
  }

  const stripeMode = getStripeMode()

  // Idempotency check - prevent duplicate processing
  const existingEvent = await prisma.processedStripeEvent.findUnique({
    where: { id: event.id },
  })

  if (existingEvent) {
    console.log(`[Webhook] Event ${event.id} already processed, skipping`)
    return NextResponse.json({ received: true, duplicate: true }, { headers: responseHeaders })
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      console.log(`[Webhook] Session ${session.id} payment_status=${session.payment_status}, skipping`)
      return NextResponse.json({ received: true, skipped: 'not_paid' }, { headers: responseHeaders })
    }

    const reportId = session.metadata?.reportId
    const userId = session.metadata?.userId

    if (!reportId || !userId) {
      console.error(`[Webhook] Missing metadata in session ${session.id}`)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400, headers: responseHeaders })
    }

    try {
      // Fetch the report to get profile and initial AI ideas
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      })

      if (!report) {
        console.error(`[Webhook] Report ${reportId} not found`)
        return NextResponse.json({ error: 'Report not found' }, { status: 404, headers: responseHeaders })
      }

      // Generate full details for top 3 ideas (paid content)
      const profile = report.fitProfile as unknown as FitProfile
      const aiIdeas = (report.aiIdeas as unknown as AIIdea[]) || []
      let additionalCost = 0

      // Expand top 3 ideas with detailed info
      const expandedIdeas = await Promise.all(
        aiIdeas.slice(0, 5).map(async (idea, idx) => {
          if (idx < 3) {
            // Full expansion for top 3
            const { data, cost } = await generateFullReport(profile, {
              name: idea.name,
              desc: idea.desc,
            })
            additionalCost += cost
            return { ...idea, ...data }
          }
          return idea
        })
      )

      const totalCost = (report.aiCost || 0) + additionalCost
      console.log(`[Webhook] Generated full report for $${additionalCost.toFixed(6)} (total: $${totalCost.toFixed(6)})`)

      // Single transaction: record event + create purchase + unlock report + update AI content
      await prisma.$transaction(async (tx) => {
        // Record processed event for idempotency
        await tx.processedStripeEvent.create({
          data: {
            id: event.id,
            mode: stripeMode,
            eventType: event.type,
          },
        })

        // Create purchase record
        await tx.purchase.create({
          data: {
            userId,
            reportId,
            stripeSessionId: session.id,
            stripePaymentId: session.payment_intent as string,
            amount: REPORT_PRICE_CENTS,
            credits: 1,
          },
        })

        // Unlock report and update with expanded AI content
        await tx.report.update({
          where: { id: reportId },
          data: {
            status: 'UNLOCKED',
            unlockedAt: new Date(),
            aiIdeas: expandedIdeas as object[],
            aiCost: totalCost,
          },
        })
      })

      console.log(`[Webhook] Report ${reportId} unlocked via ${stripeMode} mode payment`)

      // Send confirmation email with report link (non-blocking)
      const topIdea = expandedIdeas[0]
      if (topIdea && session.customer_email) {
        sendReportReadyEmail({
          email: session.customer_email,
          reportId,
          topIdeaName: topIdea.name,
          topIdeaScore: topIdea.score,
          topIdeaReason: topIdea.reason,
        }).catch(err => {
          console.error('[Webhook] Failed to send confirmation email:', err)
        })
      }
    } catch (error) {
      // Check if it's a duplicate key error (race condition)
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        console.log(`[Webhook] Event ${event.id} duplicate detected via constraint`)
        return NextResponse.json({ received: true, duplicate: true }, { headers: responseHeaders })
      }

      console.error('[Webhook] Error processing payment:', error instanceof Error ? error.message : error)
      return NextResponse.json({ error: 'Database error' }, { status: 500, headers: responseHeaders })
    }
  }

  // Record non-checkout events for audit trail (no transaction needed)
  if (event.type !== 'checkout.session.completed') {
    try {
      await prisma.processedStripeEvent.create({
        data: {
          id: event.id,
          mode: stripeMode,
          eventType: event.type,
        },
      })
    } catch {
      // Ignore duplicate event errors for non-critical events
    }
  }

  return NextResponse.json({ received: true }, { headers: responseHeaders })
}
