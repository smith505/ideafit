import { NextResponse } from 'next/server'
import { QUIZ_QUESTIONS } from '@/lib/quiz-questions'
import library from '../../../data/library.json'

interface CandidateWithTags {
  id: string
  interest_tags?: string[]
  avoid_tags?: string[]
}

export async function GET() {
  const buildSha = (process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7)

  const candidates = library.candidates as CandidateWithTags[]
  const candidatesWithTags = candidates.filter(
    (c) => c.interest_tags && c.interest_tags.length > 0 && c.avoid_tags && c.avoid_tags.length > 0
  )

  const tagsCoverage = Math.round((candidatesWithTags.length / candidates.length) * 100)

  return NextResponse.json({
    build: buildSha,
    quizQuestionCount: QUIZ_QUESTIONS.length,
    candidateCount: candidates.length,
    hasTagsCoverage: `${tagsCoverage}%`,
    timestamp: new Date().toISOString(),
  })
}
