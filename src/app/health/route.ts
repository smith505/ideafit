import { NextResponse } from 'next/server'
import { QUIZ_QUESTIONS } from '@/lib/quiz-questions'
import { validateLibrary } from '@/lib/validate-library'
import library from '../../../data/library.json'

// Force dynamic to prevent any caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Build info captured at startup
const BUILD_SHA = (process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7)
const BUILD_TIMESTAMP = new Date().toISOString()

interface CandidateWithTags {
  id: string
  interest_tags?: string[]
  avoid_tags?: string[]
  audience_mode?: string
  delivery_mode?: string
}

export async function GET() {
  const buildSha = BUILD_SHA

  const candidates = library.candidates as CandidateWithTags[]

  // Interest and avoid tags coverage
  const candidatesWithTags = candidates.filter(
    (c) => c.interest_tags && c.interest_tags.length > 0 && c.avoid_tags && c.avoid_tags.length > 0
  )
  const tagsCoverage = Math.round((candidatesWithTags.length / candidates.length) * 100)

  // Audience mode coverage
  const candidatesWithAudienceMode = candidates.filter(
    (c) => c.audience_mode && ['consumer', 'builder', 'both'].includes(c.audience_mode)
  )
  const audienceModeCoverage = Math.round((candidatesWithAudienceMode.length / candidates.length) * 100)

  // Delivery mode coverage
  const candidatesWithDeliveryMode = candidates.filter(
    (c) => c.delivery_mode && ['online_only', 'hybrid', 'offline'].includes(c.delivery_mode)
  )
  const deliveryModeCoverage = Math.round((candidatesWithDeliveryMode.length / candidates.length) * 100)

  // Count by audience mode
  const consumerCount = candidates.filter((c) => c.audience_mode === 'consumer').length
  const builderCount = candidates.filter((c) => c.audience_mode === 'builder').length
  const bothCount = candidates.filter((c) => c.audience_mode === 'both').length

  // Count by delivery mode
  const onlineOnlyCount = candidates.filter((c) => c.delivery_mode === 'online_only').length

  // Library quality validation
  const libraryValidation = validateLibrary()

  return NextResponse.json(
    {
      build: buildSha,
      quizQuestionCount: QUIZ_QUESTIONS.length,
      candidateCount: candidates.length,
      hasTagsCoverage: {
        interestAndAvoidTags: `${tagsCoverage}%`,
        audienceMode: `${audienceModeCoverage}%`,
        deliveryMode: `${deliveryModeCoverage}%`,
      },
      audienceModeBreakdown: {
        consumer: consumerCount,
        builder: builderCount,
        both: bothCount,
      },
      deliveryModeBreakdown: {
        onlineOnly: onlineOnlyCount,
      },
      libraryQuality: libraryValidation.quality,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'x-ideafit-build': BUILD_SHA,
        'x-ideafit-timestamp': BUILD_TIMESTAMP,
      },
    }
  )
}
