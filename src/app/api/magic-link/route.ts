import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMagicLink } from '@/lib/resend'
import { getBuildHeaders } from '@/lib/build-headers'
import { checkMagicLinkRateLimit, getClientIp } from '@/lib/rate-limit'
import { randomBytes } from 'crypto'
import { z } from 'zod'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'

const MagicLinkSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const headers = getBuildHeaders()

  try {
    const body = await request.json()
    const { email } = MagicLinkSchema.parse(body)

    // Rate limiting
    const ip = getClientIp(request)
    const rateLimit = checkMagicLinkRateLimit(ip, email)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': String(rateLimit.retryAfter || 600),
          },
        }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists - return success anyway
      // But don't actually send an email
      return NextResponse.json({ success: true }, { headers })
    }

    // Generate token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create magic link
    await prisma.magicLink.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Send email
    await sendMagicLink(email, token)

    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    console.error('[MagicLink] Error:', error instanceof Error ? error.message : error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400, headers }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500, headers }
    )
  }
}
