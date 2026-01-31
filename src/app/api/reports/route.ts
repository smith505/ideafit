import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rankIdeas, buildFitProfile } from '@/lib/fit-algorithm'
import { z } from 'zod'

const CreateReportSchema = z.object({
  email: z.string().email(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, answers } = CreateReportSchema.parse(body)

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email },
      })
    }

    // Compute fit results
    const { profile, rankedIdeas, fitTrack, winnerId } = rankIdeas(answers)

    // Create report
    const report = await prisma.report.create({
      data: {
        userId: user.id,
        quizAnswers: answers as object,
        fitProfile: profile as object,
        rankedIdeas: rankedIdeas as object[],
        fitTrack,
        winnerId,
        status: 'PREVIEW',
      },
    })

    return NextResponse.json({ reportId: report.id })
  } catch (error) {
    console.error('Error creating report:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
