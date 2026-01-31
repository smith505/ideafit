import library from '../../data/library.json'
import { QuizAnswers } from './quiz-questions'

type Candidate = (typeof library.candidates)[number]

export interface FitProfile {
  timeWeekly: string
  techComfort: string
  supportTolerance: string
  revenueGoal: string
  buildPreference: string
  audienceAccess: string[]
  riskTolerance: string
  existingSkills: string[]
}

export interface RankedIdea {
  id: string
  name: string
  score: number
  reason: string
  track: string
}

export function buildFitProfile(answers: QuizAnswers): FitProfile {
  return {
    timeWeekly: (answers.time_weekly as string) || '6-10',
    techComfort: (answers.tech_comfort as string) || 'some',
    supportTolerance: (answers.support_tolerance as string) || 'low',
    revenueGoal: (answers.revenue_goal as string) || 'side',
    buildPreference: (answers.build_preference as string) || 'solo',
    audienceAccess: (answers.audience_access as string[]) || [],
    riskTolerance: (answers.risk_tolerance as string) || 'medium',
    existingSkills: (answers.existing_skills as string[]) || [],
  }
}

function extractPriceNumber(priceStr: string): number {
  const match = priceStr.match(/\$(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function computeFitScore(candidate: Candidate, profile: FitProfile): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Time match (max 20 points)
  const timebox = candidate.timebox_minutes || 45
  if (profile.timeWeekly === '2-5' && timebox <= 30) {
    score += 20
    reasons.push('Quick to build with limited time')
  } else if (profile.timeWeekly === '6-10' && timebox <= 45) {
    score += 15
    reasons.push('Fits your time commitment')
  } else if (profile.timeWeekly === '11-20' || profile.timeWeekly === '20+') {
    score += 10
    reasons.push('You have enough time for this')
  }

  // Tech comfort match (max 20 points)
  const trackLower = (candidate.track_id || '').toLowerCase()
  if (profile.techComfort === 'dev') {
    if (trackLower.includes('extension') || trackLower.includes('tool')) {
      score += 20
      reasons.push('Matches your dev skills')
    } else {
      score += 15
    }
  } else if (profile.techComfort === 'nocode' || profile.techComfort === 'some') {
    if (trackLower.includes('widget') || trackLower.includes('smb')) {
      score += 15
      reasons.push('Can be built with no-code or minimal code')
    } else {
      score += 10
    }
  } else {
    score += 5
  }

  // Support tolerance match (max 15 points)
  const pricingModel = candidate.pricing_model || ''
  if (profile.supportTolerance === 'none' || profile.supportTolerance === 'low') {
    if (pricingModel === 'one-time') {
      score += 15
      reasons.push('One-time purchase = less ongoing support')
    } else {
      score += 5
    }
  } else {
    score += 10
  }

  // Audience access match (max 20 points)
  const audienceLower = (candidate.audience || '').toLowerCase()
  if (profile.audienceAccess.includes('smb') && audienceLower.includes('small business')) {
    score += 20
    reasons.push('You have access to the target audience')
  } else if (profile.audienceAccess.includes('developers') && audienceLower.includes('knowledge worker')) {
    score += 15
    reasons.push('Your network includes the target users')
  } else if (profile.audienceAccess.includes('none')) {
    // No penalty, but no bonus
    score += 5
  } else {
    score += 10
  }

  // Revenue goal match (max 15 points)
  const priceNum = extractPriceNumber(candidate.pricing_range || '')
  if (profile.revenueGoal === 'side' && priceNum <= 50) {
    score += 15
    reasons.push('Price point fits side income goals')
  } else if (profile.revenueGoal === 'ramen' && priceNum >= 20 && priceNum <= 100) {
    score += 15
    reasons.push('Revenue potential matches ramen profitability')
  } else if (profile.revenueGoal === 'salary' || profile.revenueGoal === 'scale') {
    if (pricingModel === 'subscription') {
      score += 15
      reasons.push('Subscription model supports scaling')
    } else {
      score += 10
    }
  } else {
    score += 5
  }

  // Completeness bonus (max 10 points)
  if (candidate.competitors.length >= 3 && candidate.voc_quotes.length >= 3) {
    score += 10
    reasons.push('Well-researched with validation data')
  } else if (candidate.competitors.length >= 2) {
    score += 5
  }

  return { score, reasons }
}

export function rankIdeas(answers: QuizAnswers): {
  profile: FitProfile
  rankedIdeas: RankedIdea[]
  fitTrack: string
  winnerId: string
} {
  const profile = buildFitProfile(answers)

  const scored = library.candidates.map((candidate) => {
    const { score, reasons } = computeFitScore(candidate, profile)
    return {
      id: candidate.id,
      name: candidate.name,
      score,
      reason: reasons.slice(0, 2).join('. ') || 'Good fit for your profile',
      track: candidate.track_id || 'Uncategorized',
    }
  })

  const rankedIdeas = scored.sort((a, b) => b.score - a.score).slice(0, 5)
  const winner = rankedIdeas[0]

  return {
    profile,
    rankedIdeas,
    fitTrack: winner.track,
    winnerId: winner.id,
  }
}

export function getIdeaById(id: string) {
  return library.candidates.find((c) => c.id === id)
}

export function getTrackById(id: string) {
  return library.tracks.find((t) => t.id === id)
}
