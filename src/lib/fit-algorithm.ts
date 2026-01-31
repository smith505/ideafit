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
  audience_mode: 'consumer' | 'builder' | 'both'
  delivery_mode: 'online_only' | 'hybrid' | 'offline'
}

export type AudienceMode = 'consumer' | 'builder'

export interface FitProfile {
  audienceMode: AudienceMode
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
  breakdown?: ScoreBreakdown
}

export function buildFitProfile(answers: QuizAnswers): FitProfile {
  return {
    audienceMode: (answers.audience_mode as AudienceMode) || 'builder',
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

// Score breakdown for debugging
export interface ScoreBreakdown {
  baseFit: number
  interestBoost: number
  avoidPenalty: number
  distributionBoost: number
  quitReasonBoost: number
  // Credibility penalties (strong violations of user preferences)
  credibilityPenalty: number
  credibilityFlags: string[]
  // Audience mode penalties
  audiencePenalty: number
  // Delivery mode boost/penalty
  deliveryBoost: number
  total: number
  wasCapped: boolean
}

// Human-readable distribution type labels
export const distributionTypeLabels: Record<string, string> = {
  seo: 'Search & SEO',
  communities: 'Community forums',
  ads: 'Paid advertising',
  partnerships: 'Partner outreach',
  marketplace: 'App stores & marketplaces',
  direct: 'Direct sales',
  social: 'Social media',
  organic: 'Organic discovery',
}

// Human-readable support level labels
export const supportLevelLabels: Record<string, string> = {
  low: 'Minimal support needed',
  medium: 'Some support expected',
  high: 'High-touch support required',
}

// Confidence level calculation
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export function calculateConfidence(topScore: number, runnerUpScore: number): {
  level: ConfidenceLevel
  gap: number
  explanation: string
} {
  const gap = topScore - runnerUpScore
  if (gap >= 10) {
    return {
      level: 'high',
      gap,
      explanation: `Clear winner by ${gap} points - this idea stands out for your profile`,
    }
  } else if (gap >= 5) {
    return {
      level: 'medium',
      gap,
      explanation: `Good match with ${gap} point lead - runner-up is also worth considering`,
    }
  } else {
    return {
      level: 'low',
      gap,
      explanation: `Close call with only ${gap} point difference - consider both options carefully`,
    }
  }
}

// Find best wildcard from different track
export function findWildcard(rankedIdeas: RankedIdea[], topTrack: string): RankedIdea | null {
  for (const idea of rankedIdeas) {
    if (idea.track !== topTrack) {
      return idea
    }
  }
  return null
}

function computeFitScore(candidate: Candidate, profile: FitProfile): { score: number; reasons: string[]; breakdown: ScoreBreakdown } {
  let score = 0
  const reasons: string[] = []

  // Track score components for debugging
  let baseFit = 0
  let interestBoost = 0
  let avoidPenalty = 0
  let distributionBoost = 0
  let quitReasonBoost = 0
  let credibilityPenalty = 0
  const credibilityFlags: string[] = []
  let audiencePenalty = 0
  let deliveryBoost = 0

  // Get candidate tags early for credibility checks
  const candidateDistType = (candidate as CandidateWithTags).distribution_type || ''
  const candidateSupportLevelEarly = (candidate as CandidateWithTags).support_level || ''
  const candidateAvoidTagsEarly = (candidate as CandidateWithTags).avoid_tags || []
  const candidateAudienceMode = (candidate as CandidateWithTags).audience_mode || 'both'
  const candidateDeliveryMode = (candidate as CandidateWithTags).delivery_mode || 'online_only'

  // ===== AUDIENCE MODE PENALTIES =====
  // Consumer mode: hard exclude or penalize builder-only candidates
  if (profile.audienceMode === 'consumer' && candidateAudienceMode === 'builder') {
    audiencePenalty = 30
    credibilityFlags.push('Audience mismatch: this is a builder-focused idea, but you selected consumer mode')
  }
  // Builder mode: mild penalty for consumer-only (builders can still build consumer ideas)
  if (profile.audienceMode === 'builder' && candidateAudienceMode === 'consumer') {
    audiencePenalty = 10
  }

  // ===== DELIVERY MODE BOOST/PENALTY =====
  // Boost for online_only (our target for v1)
  if (candidateDeliveryMode === 'online_only') {
    deliveryBoost = 5
  }
  // Strong penalty for hybrid/offline (should never trigger in v1 if library is correct)
  if (candidateDeliveryMode === 'hybrid' || candidateDeliveryMode === 'offline') {
    deliveryBoost = -50
    credibilityFlags.push(`Delivery mismatch: this idea requires ${candidateDeliveryMode} delivery`)
  }

  // ===== CREDIBILITY PENALTIES (strong violations) =====
  // These are applied early and are much stronger than regular avoid penalties

  // If user wants to avoid support, and candidate has medium/high support level
  if (profile.avoidList.includes('support') && candidateSupportLevelEarly !== 'low') {
    credibilityPenalty += 20
    credibilityFlags.push(`Support conflict: you want to avoid support, but this requires ${candidateSupportLevelEarly} support`)
  }

  // If user wants to avoid ads, and candidate distribution is ads
  if (profile.avoidList.includes('ads') && candidateDistType === 'ads') {
    credibilityPenalty += 20
    credibilityFlags.push('Ads conflict: you want to avoid paid ads, but this relies on ad-based distribution')
  }

  // If user wants to avoid calls, check if candidate has calls in avoid_tags or requires direct sales
  if (profile.avoidList.includes('calls')) {
    if (candidateAvoidTagsEarly.includes('calls') === false && (candidateDistType === 'direct' || candidateDistType === 'partnerships')) {
      credibilityPenalty += 20
      credibilityFlags.push('Calls conflict: you want to avoid calls, but this likely requires sales calls')
    }
  }

  // If user wants to avoid content/SEO, and candidate distribution is seo
  if (profile.avoidList.includes('content') && candidateDistType === 'seo') {
    credibilityPenalty += 15
    credibilityFlags.push('Content conflict: you want to avoid SEO/content, but this relies on content marketing')
  }

  // If user wants to avoid community, and candidate distribution is communities
  if (profile.avoidList.includes('community') && candidateDistType === 'communities') {
    credibilityPenalty += 15
    credibilityFlags.push('Community conflict: you want to avoid community building, but this relies on community channels')
  }

  // Time match (max 20 points) - now using timebox_days
  const timeboxDays = (candidate as { timebox_days?: number }).timebox_days || 14
  if (profile.timeWeekly === '2-5' && timeboxDays <= 7) {
    baseFit += 20
    reasons.push('Quick to build with limited time')
  } else if (profile.timeWeekly === '6-10' && timeboxDays <= 14) {
    baseFit += 15
    reasons.push('Fits your time commitment')
  } else if (profile.timeWeekly === '11-20' || profile.timeWeekly === '20+') {
    baseFit += 10
    reasons.push('You have enough time for this')
  }

  // Tech comfort match (max 20 points)
  const trackLower = (candidate.track_id || '').toLowerCase()
  if (profile.techComfort === 'dev') {
    if (trackLower.includes('extension') || trackLower.includes('tool')) {
      baseFit += 20
      reasons.push('Matches your dev skills')
    } else {
      baseFit += 15
    }
  } else if (profile.techComfort === 'nocode' || profile.techComfort === 'some') {
    if (trackLower.includes('widget') || trackLower.includes('smb')) {
      baseFit += 15
      reasons.push('Can be built with no-code or minimal code')
    } else {
      baseFit += 10
    }
  } else {
    baseFit += 5
  }

  // Support tolerance match (max 15 points)
  // Using explicit support_level from candidate
  const candidateSupportLevelBase = (candidate as CandidateWithTags).support_level || 'medium'
  if (profile.supportTolerance === 'none' || profile.supportTolerance === 'low') {
    if (candidateSupportLevelBase === 'low') {
      baseFit += 15
      reasons.push('Low support requirements match your preference')
    } else if (candidateSupportLevelBase === 'medium') {
      baseFit += 8
    } else {
      baseFit += 3
    }
  } else if (profile.supportTolerance === 'medium') {
    if (candidateSupportLevelBase !== 'high') {
      baseFit += 12
    } else {
      baseFit += 6
    }
  } else {
    baseFit += 10
  }

  // Audience access match (max 20 points)
  const audienceLower = (candidate.audience || '').toLowerCase()
  if (profile.audienceAccess.includes('smb') && audienceLower.includes('small business')) {
    baseFit += 20
    reasons.push('You have access to the target audience')
  } else if (profile.audienceAccess.includes('developers') && (audienceLower.includes('developer') || audienceLower.includes('knowledge worker'))) {
    baseFit += 15
    reasons.push('Your network includes the target users')
  } else if (profile.audienceAccess.includes('none')) {
    baseFit += 5
  } else {
    baseFit += 10
  }

  // Revenue goal match (max 15 points) - based on timebox (faster = smaller revenue potential)
  const timeboxForRevenue = timeboxDays
  if (profile.revenueGoal === 'side' && timeboxForRevenue <= 14) {
    baseFit += 15
    reasons.push('Quick build matches side income goals')
  } else if (profile.revenueGoal === 'ramen') {
    baseFit += 12
    reasons.push('Good fit for sustainable indie income')
  } else if (profile.revenueGoal === 'salary' || profile.revenueGoal === 'scale') {
    baseFit += 10
  } else {
    baseFit += 8
  }

  // Completeness bonus (max 10 points)
  if (candidate.competitors.length >= 3 && candidate.voc_quotes.length >= 3) {
    baseFit += 10
    reasons.push('Well-researched with validation data')
  } else if (candidate.competitors.length >= 2) {
    baseFit += 5
  }

  // ===== PERSONALIZATION SCORING =====
  const descLower = (candidate.description || '').toLowerCase()
  const nameLower = (candidate.name || '').toLowerCase()
  // mvp_in is now an array
  const mvpInArray = (candidate as { mvp_in?: string[] }).mvp_in || []
  const mvpInLower = mvpInArray.join(' ').toLowerCase()

  // Get explicit tags from candidate (if available)
  // Note: candidateDistType defined earlier for credibility checks
  const candidateInterestTags = (candidate as CandidateWithTags).interest_tags || []
  const candidateAvoidTags = (candidate as CandidateWithTags).avoid_tags || []
  const candidateSupportLevel = candidateSupportLevelEarly

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
    interestBoost += themeBonus
    if (themeMatches >= 2) {
      reasons.push('Matches your interest areas')
    }
  }

  // Avoid list penalties (up to -20 points)
  // Check explicit avoid_tags first, then fallback to heuristics
  let localAvoidPenalty = 0

  for (const avoid of profile.avoidList) {
    if (avoid === 'none') continue

    // Check explicit avoid tags first (stronger penalty)
    if (candidateAvoidTags.includes(avoid)) {
      localAvoidPenalty += 8
      continue
    }

    // Fallback to heuristic matching based on explicit distribution_type and support_level
    switch (avoid) {
      case 'calls':
        // If distribution involves direct sales, it likely needs calls
        if (candidateDistType === 'partnerships' || candidateDistType === 'direct') {
          localAvoidPenalty += 5
        }
        break
      case 'social':
        // If distribution is social media based
        if (candidateDistType === 'social' || descLower.includes('social') || descLower.includes('twitter')) {
          localAvoidPenalty += 5
        }
        break
      case 'support':
        if (candidateSupportLevel === 'high' || candidateSupportLevel === 'medium') {
          localAvoidPenalty += 5
        }
        break
      case 'content':
        // If distribution is SEO/content based
        if (candidateDistType === 'seo' || descLower.includes('seo') || descLower.includes('blog')) {
          localAvoidPenalty += 5
        }
        break
      case 'ads':
        if (candidateDistType === 'ads') {
          localAvoidPenalty += 5
        }
        break
      case 'community':
        if (candidateDistType === 'communities' || descLower.includes('community') || descLower.includes('forum')) {
          localAvoidPenalty += 5
        }
        break
      case 'integrations':
        if (mvpInLower.includes('api') || mvpInLower.includes('integration') ||
            mvpInLower.includes('connect')) {
          localAvoidPenalty += 5
        }
        break
    }
  }

  // Apply penalty (capped at -20)
  avoidPenalty = Math.min(20, localAvoidPenalty)

  // Distribution comfort alignment (max 10 points)
  if (profile.distributionComfort && profile.distributionComfort !== 'unsure') {
    // Check explicit distribution_type
    if (candidateDistType && candidateDistType === profile.distributionComfort) {
      distributionBoost += 10
      reasons.push('Distribution channel matches your strength')
    } else if (candidateDistType) {
      // Partial match based on related distribution types
      const distRelated: Record<string, string[]> = {
        seo: ['content', 'organic'],
        communities: ['reddit', 'discord', 'forums'],
        ads: ['paid', 'ppc'],
        partnerships: ['affiliate', 'influencer'],
      }
      const related = distRelated[profile.distributionComfort] || []
      if (related.includes(candidateDistType)) {
        distributionBoost += 6
        reasons.push('Related distribution channel')
      }
    }
  }

  // Quit reason alignment (max 5 points)
  if (profile.quitReason === 'motivation' && timeboxDays <= 7) {
    quitReasonBoost += 5
    reasons.push('Quick to build - stays motivating')
  }
  if (profile.quitReason === 'stuck' && profile.techComfort === 'dev') {
    quitReasonBoost += 5
  }
  if (profile.quitReason === 'no_users' && trackLower.includes('extension')) {
    // Chrome extensions have built-in distribution via the Chrome Web Store
    quitReasonBoost += 5
    reasons.push('Built-in distribution channel')
  }

  // Calculate total score and cap at 100
  const rawScore = baseFit + interestBoost - avoidPenalty + distributionBoost + quitReasonBoost - credibilityPenalty - audiencePenalty + deliveryBoost
  const wasCapped = rawScore > 100
  score = Math.min(100, Math.max(0, rawScore)) // Cap between 0-100

  const breakdown: ScoreBreakdown = {
    baseFit,
    interestBoost,
    avoidPenalty,
    distributionBoost,
    quitReasonBoost,
    credibilityPenalty,
    credibilityFlags,
    audiencePenalty,
    deliveryBoost,
    total: score,
    wasCapped,
  }

  return { score, reasons, breakdown }
}

export function rankIdeas(answers: QuizAnswers, options?: { seed?: number; limit?: number }): {
  profile: FitProfile
  rankedIdeas: RankedIdea[]
  fitTrack: string
  winnerId: string
} {
  const profile = buildFitProfile(answers)
  const limit = options?.limit || 5

  const scored = library.candidates.map((candidate) => {
    const { score, reasons, breakdown } = computeFitScore(candidate, profile)
    return {
      id: candidate.id,
      name: candidate.name,
      score,
      reason: reasons.slice(0, 2).join('. ') || 'Good fit for your profile',
      track: candidate.track_id || 'Uncategorized',
      breakdown,
    }
  })

  // Sort by score, with optional shuffle for ties using seed
  let sorted = scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // For ties, use seed-based deterministic shuffle if provided
    if (options?.seed !== undefined) {
      const aHash = hashCode(a.id + options.seed)
      const bHash = hashCode(b.id + options.seed)
      return bHash - aHash
    }
    return 0
  })

  const rankedIdeas = sorted.slice(0, limit)
  const winner = rankedIdeas[0]

  return {
    profile,
    rankedIdeas,
    fitTrack: winner.track,
    winnerId: winner.id,
  }
}

// Simple deterministic hash for seed-based shuffling
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
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
    if (candidateSupportLevel === 'low') {
      chips.push({ label: chipLabels.supportTolerance[profile.supportTolerance], type: 'match' })
    }
  }

  // Distribution comfort chip
  if (profile.distributionComfort && profile.distributionComfort !== 'unsure') {
    const candidateDistType = candidate.distribution_type || ''

    const distMatches =
      candidateDistType === profile.distributionComfort ||
      (profile.distributionComfort === 'communities' && candidateDistType === 'communities') ||
      (profile.distributionComfort === 'ads' && candidateDistType === 'ads') ||
      (profile.distributionComfort === 'seo' && candidateDistType === 'seo')

    if (distMatches) {
      chips.push({ label: chipLabels.distributionComfort[profile.distributionComfort], type: 'match' })
    }
  }

  // Quit reason chip
  if (profile.quitReason && profile.quitReason !== '') {
    const label = chipLabels.quitReason[profile.quitReason]
    const timeboxDays = (candidate as { timebox_days?: number }).timebox_days || 14
    const trackLower = (candidate.track_id || '').toLowerCase()
    if (label) {
      if (profile.quitReason === 'motivation' && timeboxDays <= 14) {
        chips.push({ label, type: 'match' })
      } else if (profile.quitReason === 'no_users' && trackLower.includes('extension')) {
        // Chrome extensions have built-in distribution via the Chrome Web Store
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
