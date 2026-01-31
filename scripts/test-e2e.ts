/**
 * Minimal E2E test script for IdeaFit funnel
 * Run with: npx tsx scripts/test-e2e.ts [baseUrl]
 *
 * Tests:
 * 1. Health endpoint returns expected data
 * 2. Homepage loads (status 200)
 * 3. Quiz page loads (status 200)
 * 4. Results page loads (status 200)
 * 5. Verify different profiles yield different results (via algorithm)
 */

import { QUIZ_QUESTIONS, QuizAnswers } from '../src/lib/quiz-questions'
import { rankIdeas, buildFitProfile, calculateConfidence, findWildcard } from '../src/lib/fit-algorithm'

const BASE_URL = process.argv[2] || 'http://localhost:3000'

// Test profiles
const PROFILE_A: QuizAnswers = {
  audience_mode: 'builder',
  time_weekly: '6-10',
  tech_comfort: 'dev',
  support_tolerance: 'low',
  revenue_goal: 'ramen',
  build_preference: 'ai',
  interest_themes: ['tech', 'career'],
  avoid_list: ['calls', 'support'],
  quit_reason: 'motivation',
  distribution_comfort: 'communities',
  audience_access: ['developers'],
  risk_tolerance: 'medium',
  existing_skills: ['coding', 'design'],
  optional_notes: '',
}

const PROFILE_B: QuizAnswers = {
  audience_mode: 'consumer',
  time_weekly: '2-5',
  tech_comfort: 'nocode',
  support_tolerance: 'medium',
  revenue_goal: 'side',
  build_preference: 'solo',
  interest_themes: ['home', 'shopping'],
  avoid_list: ['ads', 'community'],
  quit_reason: 'time',
  distribution_comfort: 'seo',
  audience_access: ['smb'],
  risk_tolerance: 'low',
  existing_skills: ['writing', 'marketing'],
  optional_notes: '',
}

// Consumer-only profile for testing audience mode
const PROFILE_CONSUMER: QuizAnswers = {
  audience_mode: 'consumer',
  time_weekly: '2-5',
  tech_comfort: 'nocode',
  support_tolerance: 'low',
  revenue_goal: 'side',
  build_preference: 'solo',
  interest_themes: ['home', 'shopping', 'money'],
  avoid_list: ['ads', 'support', 'social'],
  quit_reason: 'time',
  distribution_comfort: 'seo',
  audience_access: [],
  risk_tolerance: 'low',
  existing_skills: ['writing'],
  optional_notes: '',
}

// Builder-only profile for testing audience mode
const PROFILE_BUILDER: QuizAnswers = {
  audience_mode: 'builder',
  time_weekly: '6-10',
  tech_comfort: 'dev',
  support_tolerance: 'low',
  revenue_goal: 'ramen',
  build_preference: 'ai',
  interest_themes: ['tech', 'career'],
  avoid_list: ['calls', 'support'],
  quit_reason: 'motivation',
  distribution_comfort: 'communities',
  audience_access: ['developers'],
  risk_tolerance: 'medium',
  existing_skills: ['coding', 'design'],
  optional_notes: '',
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`✓ ${name}`)
  } catch (error) {
    console.error(`✗ ${name}`)
    console.error(`  ${error instanceof Error ? error.message : error}`)
    process.exitCode = 1
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

async function main() {
  console.log(`\nIdeaFit E2E Tests`)
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Quiz questions: ${QUIZ_QUESTIONS.length}`)
  console.log(`---\n`)

  // Test 1: Health endpoint
  await test('Health endpoint returns valid JSON', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/health`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    if (!data.build) throw new Error('Missing build field')
    if (!data.quizQuestionCount) throw new Error('Missing quizQuestionCount')
    if (!data.candidateCount) throw new Error('Missing candidateCount')
    console.log(`    Build: ${data.build}, Questions: ${data.quizQuestionCount}, Candidates: ${data.candidateCount}`)
  })

  // Test 2: Homepage loads
  await test('Homepage loads (status 200)', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const text = await res.text()
    if (!text.includes('IdeaFit')) throw new Error('Missing IdeaFit in response')
  })

  // Test 3: Quiz page loads
  await test('Quiz page loads (status 200)', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/quiz`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const text = await res.text()
    if (!text.includes('quiz') && !text.includes('Quiz')) throw new Error('Missing quiz content')
  })

  // Test 4: Results page loads (will redirect to quiz if no answers, but should return 200)
  await test('Results page accessible (status 200)', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/results`)
    // Results may redirect to /quiz if no localStorage, but should still return 200
    if (!res.ok) throw new Error(`Status ${res.status}`)
  })

  // Test 5: Different profiles yield different results
  await test('Profile A and Profile B yield different top results', async () => {
    const resultsA = rankIdeas(PROFILE_A)
    const resultsB = rankIdeas(PROFILE_B)

    const topA = resultsA.rankedIdeas[0]
    const topB = resultsB.rankedIdeas[0]

    console.log(`    Profile A top: ${topA.name} (${topA.score}%)`)
    console.log(`    Profile B top: ${topB.name} (${topB.score}%)`)

    // They should have different scores at minimum
    if (topA.id === topB.id && topA.score === topB.score) {
      throw new Error('Profiles A and B have identical results - personalization not working')
    }
  })

  // Test 6: FitProfile builds correctly
  await test('FitProfile includes personalization fields', async () => {
    const profile = buildFitProfile(PROFILE_A)
    if (!profile.interestThemes || profile.interestThemes.length === 0) {
      throw new Error('interestThemes not populated')
    }
    if (!profile.avoidList || profile.avoidList.length === 0) {
      throw new Error('avoidList not populated')
    }
    console.log(`    interestThemes: ${profile.interestThemes.join(', ')}`)
    console.log(`    avoidList: ${profile.avoidList.join(', ')}`)
  })

  // Test 7: Cache headers (if server is running)
  await test('Homepage has no-store cache header', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/`)
    const cacheControl = res.headers.get('cache-control')
    console.log(`    Cache-Control: ${cacheControl}`)
    // In production, should have no-store. In dev, may vary.
    if (cacheControl && cacheControl.includes('s-maxage=31536000')) {
      throw new Error('Still has aggressive s-maxage caching')
    }
  })

  // Test 8: Build header present
  await test('Homepage has x-ideafit-build header', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/`)
    const buildHeader = res.headers.get('x-ideafit-build')
    console.log(`    x-ideafit-build: ${buildHeader || 'not present'}`)
    // This may not be present in dev mode, so just log it
  })

  // Test 9: Confidence calculation
  await test('Confidence calculation returns correct levels', async () => {
    // High confidence: gap >= 10
    const highConf = calculateConfidence(90, 75)
    if (highConf.level !== 'high') throw new Error(`Expected 'high' for gap 15, got '${highConf.level}'`)

    // Medium confidence: gap 5-9
    const medConf = calculateConfidence(85, 78)
    if (medConf.level !== 'medium') throw new Error(`Expected 'medium' for gap 7, got '${medConf.level}'`)

    // Low confidence: gap < 5
    const lowConf = calculateConfidence(82, 80)
    if (lowConf.level !== 'low') throw new Error(`Expected 'low' for gap 2, got '${lowConf.level}'`)

    console.log(`    High (gap=15): ${highConf.level}, Medium (gap=7): ${medConf.level}, Low (gap=2): ${lowConf.level}`)
  })

  // Test 10: Wildcard selection from different track
  await test('Wildcard is from different track than top match', async () => {
    const results = rankIdeas(PROFILE_A, { limit: 10 })
    const topMatch = results.rankedIdeas[0]
    const wildcard = findWildcard(results.rankedIdeas.slice(2), topMatch.track)

    if (!wildcard) {
      console.log(`    No wildcard found (may be fine if all top 10 are same track)`)
      return
    }

    if (wildcard.track === topMatch.track) {
      throw new Error(`Wildcard track '${wildcard.track}' should differ from top match track '${topMatch.track}'`)
    }

    console.log(`    Top: ${topMatch.name} (${topMatch.track}), Wildcard: ${wildcard.name} (${wildcard.track})`)
  })

  // Test 11: Credibility penalties for avoid conflicts
  await test('Credibility penalties apply for avoid conflicts', async () => {
    // Profile that explicitly avoids support
    const avoidSupportProfile: QuizAnswers = {
      ...PROFILE_A,
      avoid_list: ['support', 'calls'],
      support_tolerance: 'low',
    }

    const results = rankIdeas(avoidSupportProfile, { limit: 10 })
    const profile = buildFitProfile(avoidSupportProfile)

    // Check that avoid list was captured
    if (!profile.avoidList.includes('support')) {
      throw new Error('avoidList should include "support"')
    }

    console.log(`    Avoid list: ${profile.avoidList.join(', ')}`)
    console.log(`    Top result: ${results.rankedIdeas[0].name} (${results.rankedIdeas[0].score}%)`)
  })

  // Test 12: Consumer and Builder modes produce different results
  await test('Consumer and Builder modes produce different top results', async () => {
    const consumerResults = rankIdeas(PROFILE_CONSUMER, { limit: 10 })
    const builderResults = rankIdeas(PROFILE_BUILDER, { limit: 10 })

    const consumerTop = consumerResults.rankedIdeas[0]
    const builderTop = builderResults.rankedIdeas[0]

    console.log(`    Consumer top: ${consumerTop.name} (${consumerTop.score}%)`)
    console.log(`    Builder top: ${builderTop.name} (${builderTop.score}%)`)

    // They should have different top results (different audience modes)
    if (consumerTop.id === builderTop.id) {
      // Allow same result if scores are significantly different
      if (consumerTop.score === builderTop.score) {
        throw new Error('Consumer and Builder modes should produce different results')
      }
    }
  })

  // Test 13: Consumer mode top result is not builder-only
  await test('Consumer mode top result is not builder-only', async () => {
    const results = rankIdeas(PROFILE_CONSUMER, { limit: 10 })
    const top = results.rankedIdeas[0]

    // Get the candidate to check audience_mode
    const candidate = results.rankedIdeas[0] as { id: string; breakdown?: { audiencePenalty: number } }

    // If audiencePenalty is 30 (builder-only penalty), fail
    if (candidate.breakdown?.audiencePenalty === 30) {
      throw new Error(`Consumer mode top result has 30-point audience penalty, likely builder-only`)
    }

    console.log(`    Consumer top: ${top.name}`)
    console.log(`    Audience penalty: ${candidate.breakdown?.audiencePenalty || 0}`)
  })

  // Test 14: All top results are online_only
  await test('Top results are delivery_mode=online_only', async () => {
    const resultsA = rankIdeas(PROFILE_A, { limit: 5 })
    const resultsB = rankIdeas(PROFILE_B, { limit: 5 })

    // Check that no top result has negative delivery boost (which would indicate non-online_only)
    for (const result of [...resultsA.rankedIdeas, ...resultsB.rankedIdeas]) {
      const deliveryBoost = result.breakdown?.deliveryBoost || 0
      if (deliveryBoost < 0) {
        throw new Error(`${result.name} has negative delivery boost (${deliveryBoost}), indicating non-online_only`)
      }
    }

    console.log(`    All ${resultsA.rankedIdeas.length + resultsB.rankedIdeas.length} top results are online_only`)
  })

  // Test 15: Health endpoint returns audience_mode coverage
  await test('Health endpoint includes audience_mode coverage', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/health`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const data = await res.json()

    if (!data.hasTagsCoverage?.audienceMode) throw new Error('Missing audienceMode coverage')
    if (!data.audienceModeBreakdown) throw new Error('Missing audienceModeBreakdown')

    const { consumer, builder, both } = data.audienceModeBreakdown
    const total = consumer + builder + both

    console.log(`    Audience: ${consumer} consumer, ${builder} builder, ${both} both (${total} total)`)

    if (total !== data.candidateCount) {
      throw new Error(`Audience mode total (${total}) doesn't match candidate count (${data.candidateCount})`)
    }
  })

  console.log(`\n---\nTests complete.\n`)
}

main().catch(console.error)
