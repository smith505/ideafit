import library from '../../data/library.json'
import { QuizAnswers } from './quiz-questions'

type Candidate = (typeof library.candidates)[number]

// Extended candidate type - these fields are now included in library.json
// Using type alias to allow optional access pattern
type CandidateWithTags = Candidate & {
  interest_tags: string[]
  avoid_tags: string[]
  distribution_type: string
  support_level: string
}

export interface FitProfile {
  timeWeekly: string
  techComfort: string
  supportTolerance: string
  revenueGoal: string
  buildPreference: string
  audienceAccess: string[]
  riskTolerance: string
  existingSkills: string[]
  // Personalization fields
  interestThemes: string[]
  avoidList: string[]
  optionalNotes: string
  quitReason: string
  distributionComfort: string
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
    // Personalization fields
    interestThemes: (answers.interest_themes as string[]) || [],
    avoidList: (answers.avoid_list as string[]) || [],
    optionalNotes: (answers.optional_notes as string) || '',
    quitReason: (answers.quit_reason as string) || '',
    distributionComfort: (answers.distribution_comfort as string) || 'unsure',
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

  // ===== PERSONALIZATION SCORING =====
  const descLower = (candidate.description || '').toLowerCase()
  const nameLower = (candidate.name || '').toLowerCase()
  const channelLower = (candidate.first10_channel || '').toLowerCase()
  const mvpInLower = (candidate.mvp_in || '').toLowerCase()

  // Get explicit tags from candidate (if available)
  const candidateInterestTags = (candidate as CandidateWithTags).interest_tags || []
  const candidateAvoidTags = (candidate as CandidateWithTags).avoid_tags || []
  const candidateDistType = (candidate as CandidateWithTags).distribution_type || ''
  const candidateSupportLevel = (candidate as CandidateWithTags).support_level || ''

  // Interest themes matching (max 15 points)
  // Prefer explicit tags, fallback to keyword matching
  const themeKeywords: Record<string, string[]> = {
    money: ['budget', 'financial', 'money', 'payment', 'invoice', 'expense', 'accounting', 'quickbooks'],
    health: ['health', 'fitness', 'workout', 'wellness', 'medical', 'nutrition'],
    career: ['career', 'productivity', 'work', 'job', 'professional', 'time', 'efficiency'],
    tech: ['developer', 'tech', 'code', 'extension', 'api', 'tool', 'chrome', 'software'],
    gaming: ['game', 'gaming', 'esport', 'stream', 'twitch'],
    shopping: ['shopping', 'deal', 'price', 'discount', 'ecommerce', 'shop'],
    home: ['home', 'diy', 'house', 'renovation', 'garden', 'property'],
    learning: ['learn', 'education', 'course', 'study', 'tutorial', 'training'],
    travel: ['travel', 'trip', 'vacation', 'booking', 'flight', 'hotel'],
  }

  let themeMatches = 0
  for (const theme of profile.interestThemes) {
    if (theme === 'none') continue

    // Check explicit tags first (stronger match)
    if (candidateInterestTags.includes(theme)) {
      themeMatches += 2 // Double weight for explicit tag match
      continue
    }

    // Fallback to keyword matching only if no explicit tags
    if (candidateInterestTags.length === 0) {
      const keywords = themeKeywords[theme] || []
      const matched = keywords.some(
        (kw) => descLower.includes(kw) || nameLower.includes(kw) || trackLower.includes(kw)
      )
      if (matched) themeMatches++
    }
  }

  if (themeMatches > 0 && profile.interestThemes.length > 0) {
    const themeBonus = Math.min(15, themeMatches * 3)
    score += themeBonus
    if (themeMatches >= 2) {
      reasons.push('Matches your interest areas')
    }
  }

  // Avoid list penalties (up to -20 points)
  // Check explicit avoid_tags first, then fallback to heuristics
  let avoidPenalty = 0

  for (const avoid of profile.avoidList) {
    if (avoid === 'none') continue

    // Check explicit avoid tags first (stronger penalty)
    if (candidateAvoidTags.includes(avoid)) {
      avoidPenalty += 8
      continue
    }

    // Fallback to heuristic matching
    switch (avoid) {
      case 'calls':
        if (channelLower.includes('demo') || channelLower.includes('call') || channelLower.includes('cold')) {
          avoidPenalty += 5
        }
        break
      case 'social':
        if (channelLower.includes('social') || channelLower.includes('twitter') ||
            channelLower.includes('fb ') || channelLower.includes('facebook') ||
            channelLower.includes('instagram') || channelLower.includes('tiktok')) {
          avoidPenalty += 5
        }
        break
      case 'support':
        if (candidateSupportLevel === 'high' || candidateSupportLevel === 'medium') {
          avoidPenalty += 5
        } else if (pricingModel === 'subscription' && candidateSupportLevel !== 'low') {
          avoidPenalty += 3
        }
        break
      case 'content':
        if (channelLower.includes('seo') || channelLower.includes('content') || channelLower.includes('blog')) {
          avoidPenalty += 5
        }
        break
      case 'ads':
        if (candidateDistType === 'ads') {
          avoidPenalty += 5
        } else if (channelLower.includes('ads') || channelLower.includes('adwords') ||
            channelLower.includes('ppc') || channelLower.includes('paid')) {
          avoidPenalty += 4
        }
        break
      case 'community':
        if (channelLower.includes('community') || channelLower.includes('discord') ||
            channelLower.includes('forum')) {
          avoidPenalty += 5
        }
        break
      case 'integrations':
        if (mvpInLower.includes('api') || mvpInLower.includes('integration') ||
            mvpInLower.includes('connect')) {
          avoidPenalty += 5
        }
        break
    }
  }

  // Apply penalty (capped at -20)
  score -= Math.min(20, avoidPenalty)

  // Distribution comfort alignment (max 10 points)
  if (profile.distributionComfort && profile.distributionComfort !== 'unsure') {
    // Check explicit distribution_type first
    if (candidateDistType && candidateDistType === profile.distributionComfort) {
      score += 10
      reasons.push('Distribution channel matches your strength')
    } else {
      // Fallback to heuristic matching
      switch (profile.distributionComfort) {
        case 'seo':
          if (channelLower.includes('seo') || channelLower.includes('search')) {
            score += 8
            reasons.push('Matches your SEO/content distribution strength')
          }
          break
        case 'communities':
          if (channelLower.includes('reddit') || channelLower.includes('discord') ||
              channelLower.includes('forum') || channelLower.includes('group')) {
            score += 8
            reasons.push('Community distribution fits your style')
          }
          break
        case 'ads':
          if (channelLower.includes('ads') || channelLower.includes('paid')) {
            score += 8
            reasons.push('Paid ads channel matches your preference')
          }
          break
        case 'partnerships':
          if (channelLower.includes('partner') || channelLower.includes('influencer') ||
              channelLower.includes('outreach')) {
            score += 8
            reasons.push('Partnership-driven distribution matches you')
          }
          break
      }
    }
  }

  // Quit reason alignment (max 5 points)
  if (profile.quitReason === 'motivation' && candidate.timebox_minutes && candidate.timebox_minutes <= 30) {
    score += 5
    reasons.push('Quick to build - stays motivating')
  }
  if (profile.quitReason === 'stuck' && profile.techComfort === 'dev') {
    score += 5
  }
  if (profile.quitReason === 'no_users' && channelLower.includes('chrome web store')) {
    score += 5
    reasons.push('Built-in distribution channel')
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

// Match chip types for displaying "Why this matches you"
export interface MatchChip {
  label: string
  type: 'match' | 'avoided'
}

// Human-readable labels for profile values
const chipLabels: Record<string, Record<string, string>> = {
  supportTolerance: {
    none: 'No support needed',
    low: 'Low support',
    medium: 'Some support OK',
    high: 'High touch OK',
  },
  distributionComfort: {
    seo: 'SEO/Content',
    communities: 'Community-driven',
    ads: 'Paid ads',
    partnerships: 'Partnerships',
    unsure: '',
  },
  quitReason: {
    motivation: 'Quick wins',
    stuck: 'Tech-friendly',
    no_users: 'Built-in distribution',
    time: 'Time-efficient',
    never: 'Ship-focused',
  },
  interestThemes: {
    money: 'Finance/Money',
    health: 'Health/Fitness',
    career: 'Productivity',
    tech: 'Tech/Dev tools',
    gaming: 'Gaming',
    shopping: 'Shopping/Deals',
    home: 'Home/DIY',
    learning: 'Learning',
    travel: 'Travel',
  },
  avoidList: {
    calls: 'No calls/demos',
    social: 'No social media',
    support: 'No heavy support',
    content: 'No SEO/content',
    ads: 'No paid ads',
    community: 'No community building',
    integrations: 'No complex integrations',
  },
}

export function generateMatchChips(profile: FitProfile, candidateId: string): MatchChip[] {
  const chips: MatchChip[] = []
  const candidate = getIdeaById(candidateId) as CandidateWithTags | undefined

  if (!candidate) return chips

  // Support tolerance chip
  if (profile.supportTolerance === 'none' || profile.supportTolerance === 'low') {
    const candidateSupportLevel = candidate.support_level || ''
    if (candidateSupportLevel === 'low' || candidate.pricing_model === 'one-time') {
      chips.push({ label: chipLabels.supportTolerance[profile.supportTolerance], type: 'match' })
    }
  }

  // Distribution comfort chip
  if (profile.distributionComfort && profile.distributionComfort !== 'unsure') {
    const candidateDistType = candidate.distribution_type || ''
    const channelLower = (candidate.first10_channel || '').toLowerCase()

    const distMatches =
      candidateDistType === profile.distributionComfort ||
      (profile.distributionComfort === 'communities' &&
        (channelLower.includes('reddit') || channelLower.includes('group'))) ||
      (profile.distributionComfort === 'ads' && channelLower.includes('ads')) ||
      (profile.distributionComfort === 'seo' && channelLower.includes('seo'))

    if (distMatches) {
      chips.push({ label: chipLabels.distributionComfort[profile.distributionComfort], type: 'match' })
    }
  }

  // Quit reason chip
  if (profile.quitReason && profile.quitReason !== '') {
    const label = chipLabels.quitReason[profile.quitReason]
    if (label) {
      if (profile.quitReason === 'motivation' && candidate.timebox_minutes && candidate.timebox_minutes <= 45) {
        chips.push({ label, type: 'match' })
      } else if (profile.quitReason === 'no_users' && (candidate.first10_channel || '').toLowerCase().includes('chrome web store')) {
        chips.push({ label, type: 'match' })
      } else if (profile.quitReason === 'never') {
        chips.push({ label, type: 'match' })
      }
    }
  }

  // Interest theme chips (max 2)
  const candidateInterestTags = candidate.interest_tags || []
  let themeChipCount = 0
  for (const theme of profile.interestThemes) {
    if (theme === 'none' || themeChipCount >= 2) continue
    if (candidateInterestTags.includes(theme)) {
      chips.push({ label: chipLabels.interestThemes[theme], type: 'match' })
      themeChipCount++
    }
  }

  // "We avoided" chips (max 2)
  const candidateAvoidTags = candidate.avoid_tags || []
  let avoidChipCount = 0
  for (const avoid of profile.avoidList) {
    if (avoid === 'none' || avoidChipCount >= 2) continue
    // Show avoided chip if candidate explicitly avoids this
    if (candidateAvoidTags.includes(avoid)) {
      chips.push({ label: chipLabels.avoidList[avoid], type: 'avoided' })
      avoidChipCount++
    }
  }

  // Limit total chips to 6
  return chips.slice(0, 6)
}
