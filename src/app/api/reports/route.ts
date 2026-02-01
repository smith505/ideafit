import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildFitProfile } from '@/lib/fit-algorithm'
import { generateIdeaMatches } from '@/lib/ai-ideas'
import { getBuildHeaders } from '@/lib/build-headers'
import { z } from 'zod'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'

const CreateReportSchema = z.object({
  email: z.string().email(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  regenReportId: z.string().optional(),
})

export async function POST(request: Request) {
  const headers = getBuildHeaders()

  try {
    const body = await request.json()
    const { email, answers, regenReportId } = CreateReportSchema.parse(body)

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email },
      })
    }

    // Build fit profile from answers
    const profile = buildFitProfile(answers)

    // Generate AI-matched ideas (cheap: ~$0.001)
    const { ideas, cost } = await generateIdeaMatches(profile)

    // Convert to ranked format for compatibility
    const rankedIdeas = ideas.map(idea => ({
      id: idea.id,
      name: idea.name,
      score: idea.score,
      reason: idea.reason,
      track: idea.track,
    }))

    const winnerId = ideas[0]?.id || 'unknown'
    const fitTrack = ideas[0]?.track || 'AI Generated'

    let reportId: string

    // Handle regeneration vs new report
    if (regenReportId) {
      // Verify report exists, is unlocked, and has regens remaining
      const existingReport = await prisma.report.findUnique({
        where: { id: regenReportId },
      })

      if (!existingReport) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404, headers }
        )
      }

      if (existingReport.status !== 'UNLOCKED') {
        return NextResponse.json(
          { error: 'Report must be unlocked to regenerate' },
          { status: 400, headers }
        )
      }

      if (existingReport.regensUsed >= existingReport.regensMax) {
        return NextResponse.json(
          { error: 'No regenerations remaining' },
          { status: 400, headers }
        )
      }

      // Update existing report with new ideas
      await prisma.report.update({
        where: { id: regenReportId },
        data: {
          quizAnswers: answers as object,
          fitProfile: profile as object,
          rankedIdeas: rankedIdeas as object[],
          aiIdeas: ideas as object[],
          aiCost: (existingReport.aiCost || 0) + cost,
          fitTrack,
          winnerId,
          regensUsed: existingReport.regensUsed + 1,
        },
      })

      reportId = regenReportId
      console.log(`[AI] Regenerated report ${reportId} (${existingReport.regensUsed + 1}/${existingReport.regensMax}) for $${cost.toFixed(6)}`)
    } else {
      // Create new report
      const report = await prisma.report.create({
        data: {
          userId: user.id,
          quizAnswers: answers as object,
          fitProfile: profile as object,
          rankedIdeas: rankedIdeas as object[],
          aiIdeas: ideas as object[],
          aiCost: cost,
          fitTrack,
          winnerId,
          status: 'PREVIEW',
        },
      })

      reportId = report.id
      console.log(`[AI] Generated ${ideas.length} ideas for $${cost.toFixed(6)}`)
    }

    return NextResponse.json({ reportId }, { headers })
  } catch (error) {
    console.error('Error creating report:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400, headers }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500, headers }
    )
  }
}
