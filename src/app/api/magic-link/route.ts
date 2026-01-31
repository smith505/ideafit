import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMagicLink } from '@/lib/resend'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const MagicLinkSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = MagicLinkSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Magic link error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
