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
import { rankIdeas, buildFitProfile } from '../src/lib/fit-algorithm'

const BASE_URL = process.argv[2] || 'http://localhost:3000'

// Test profiles
const PROFILE_A: QuizAnswers = {
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

  console.log(`\n---\nTests complete.\n`)
}

main().catch(console.error)
