'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QUIZ_QUESTIONS, QuizAnswers } from '@/lib/quiz-questions'
import {
  rankIdeas,
  buildFitProfile,
  generateMatchChips,
  getIdeaById,
  ScoreBreakdown,
  calculateConfidence,
  ConfidenceLevel,
} from '@/lib/fit-algorithm'
import library from '../../../data/library.json'

const STORAGE_KEY = 'ideafit-quiz-answers'

// Profile presets
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

const PROFILE_C: QuizAnswers = {
  audience_mode: 'builder',
  time_weekly: '6-10',
  tech_comfort: 'some',
  support_tolerance: 'low',
  revenue_goal: 'side',
  build_preference: 'solo',
  interest_themes: [],
  avoid_list: [],
  quit_reason: 'never',
  distribution_comfort: 'unsure',
  audience_access: [],
  risk_tolerance: 'medium',
  existing_skills: [],
  optional_notes: '',
}

// Consumer Profile (Home+Shopping, avoid ads/support/social)
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

// Builder Profile (Tech+Career, avoid calls/support)
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

interface CandidateWithTags {
  id: string
  name: string
  interest_tags?: string[]
  avoid_tags?: string[]
  distribution_type?: string
  support_level?: string
  audience_mode?: string
  delivery_mode?: string
}

interface DebugResult {
  id: string
  name: string
  score: number
  matchChips: string[]
  avoidChips: string[]
  distributionType: string
  supportLevel: string
  audienceMode: string
  deliveryMode: string
  breakdown?: ScoreBreakdown
}

export default function QAPage() {
  const router = useRouter()
  const [debugProfile, setDebugProfile] = useState<ReturnType<typeof buildFitProfile> | null>(null)
  const [debugResults, setDebugResults] = useState<DebugResult[]>([])
  const [currentAnswers, setCurrentAnswers] = useState<QuizAnswers | null>(null)
  const [shuffleSeed, setShuffleSeed] = useState<number | undefined>(undefined)
  const [confidence, setConfidence] = useState<{ level: ConfidenceLevel; gap: number; explanation: string } | null>(null)
  const [shuffleAnalysis, setShuffleAnalysis] = useState<{ winnerCounts: Record<string, number>; totalRuns: number } | null>(null)

  const buildSha = process.env.NEXT_PUBLIC_BUILD_SHA?.slice(0, 7) || 'dev'

  // Load current answers on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCurrentAnswers(parsed.answers || null)
      } catch {
        setCurrentAnswers(null)
      }
    }
  }, [])

  const computeResults = (answers: QuizAnswers, seed?: number) => {
    const fitProfile = buildFitProfile(answers)
    setDebugProfile(fitProfile)

    const ranked = rankIdeas(answers, { seed, limit: 10 })
    const debugData = ranked.rankedIdeas.map((idea) => {
      const chips = generateMatchChips(fitProfile, idea.id)
      const candidate = getIdeaById(idea.id) as CandidateWithTags | undefined
      return {
        id: idea.id,
        name: idea.name,
        score: idea.score,
        matchChips: chips.filter((c) => c.type === 'match').map((c) => c.label),
        avoidChips: chips.filter((c) => c.type === 'avoided').map((c) => c.label),
        distributionType: candidate?.distribution_type || 'n/a',
        supportLevel: candidate?.support_level || 'n/a',
        audienceMode: candidate?.audience_mode || 'n/a',
        deliveryMode: candidate?.delivery_mode || 'n/a',
        breakdown: idea.breakdown,
      }
    })
    setDebugResults(debugData)

    // Calculate confidence
    if (ranked.rankedIdeas.length >= 2) {
      const conf = calculateConfidence(ranked.rankedIdeas[0].score, ranked.rankedIdeas[1].score)
      setConfidence(conf)
    }
  }

  const resetQuizState = () => {
    localStorage.removeItem(STORAGE_KEY)
    setCurrentAnswers(null)
    setDebugProfile(null)
    setDebugResults([])
    setConfidence(null)
    alert('Quiz state cleared!')
  }

  const prefillAndRoute = (profile: QuizAnswers, label: string) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        answers: profile,
        currentIndex: QUIZ_QUESTIONS.length - 1,
      })
    )
    setCurrentAnswers(profile)
    computeResults(profile, shuffleSeed)
    router.push('/results')
  }

  const prefillOnly = (profile: QuizAnswers, label: string) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        answers: profile,
        currentIndex: QUIZ_QUESTIONS.length - 1,
      })
    )
    setCurrentAnswers(profile)
    computeResults(profile, shuffleSeed)
  }

  const computeDebugInfo = () => {
    if (!currentAnswers) {
      alert('No quiz answers in localStorage')
      return
    }
    computeResults(currentAnswers, shuffleSeed)
  }

  const handleShuffleSeed = () => {
    const newSeed = Date.now()
    setShuffleSeed(newSeed)
    if (currentAnswers) {
      computeResults(currentAnswers, newSeed)
    }
  }

  const handleExportJSON = () => {
    if (!debugProfile || debugResults.length === 0) {
      alert('No debug data to export. Run a profile first.')
      return
    }
    const exportData = {
      timestamp: new Date().toISOString(),
      shuffleSeed: shuffleSeed || null,
      confidence,
      profile: debugProfile,
      rankedCandidates: debugResults,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ideafit-debug-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const run20Shuffles = () => {
    if (!currentAnswers) {
      alert('No quiz answers in localStorage. Select a profile first.')
      return
    }

    const winnerCounts: Record<string, number> = {}
    const totalRuns = 20

    for (let i = 0; i < totalRuns; i++) {
      const seed = Date.now() + i * 1000 + Math.floor(Math.random() * 1000)
      const ranked = rankIdeas(currentAnswers, { seed, limit: 1 })
      const winner = ranked.rankedIdeas[0]
      if (winner) {
        const key = `${winner.name} (${winner.id})`
        winnerCounts[key] = (winnerCounts[key] || 0) + 1
      }
    }

    setShuffleAnalysis({ winnerCounts, totalRuns })
  }

  // Compute red flags for top result
  const getRedFlags = (): string[] => {
    if (debugResults.length === 0) return []
    const top = debugResults[0]
    const flags: string[] = []

    // Check credibility flags from breakdown
    if (top.breakdown?.credibilityFlags && top.breakdown.credibilityFlags.length > 0) {
      flags.push(...top.breakdown.credibilityFlags)
    }

    // Check if score was capped
    if (top.breakdown?.wasCapped) {
      flags.push('Score was capped at 100 (raw score exceeded maximum)')
    }

    // Check if confidence is low
    if (confidence?.level === 'low') {
      flags.push(`Low confidence: only ${confidence.gap} point gap between #1 and #2`)
    }

    // Check if top result is not online_only
    if (top.deliveryMode && top.deliveryMode !== 'online_only') {
      flags.push(`Delivery mode warning: top result is ${top.deliveryMode}, not online_only`)
    }

    return flags
  }

  const isDev = process.env.NODE_ENV === 'development'
  const redFlags = getRedFlags()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">QA Test Harness</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Build: <code className="text-violet-400">{buildSha}</code>
              {!isDev && <span className="ml-2 text-amber-400">(Warning: Not in dev mode)</span>}
            </p>
          </div>
          <Link href="/" className="text-violet-400 hover:text-violet-300">
            ← Back to site
          </Link>
        </div>

        {/* Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetQuizState}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg transition-colors"
            >
              Reset Quiz State
            </button>
            <button
              onClick={() => prefillOnly(PROFILE_A, 'Profile A')}
              className="px-4 py-2 bg-violet-900/50 hover:bg-violet-900 text-violet-300 rounded-lg transition-colors"
            >
              Profile A (Tech + Career)
            </button>
            <button
              onClick={() => prefillOnly(PROFILE_B, 'Profile B')}
              className="px-4 py-2 bg-emerald-900/50 hover:bg-emerald-900 text-emerald-300 rounded-lg transition-colors"
            >
              Profile B (Home + Shopping)
            </button>
            <button
              onClick={() => prefillOnly(PROFILE_C, 'Profile C')}
              className="px-4 py-2 bg-amber-900/50 hover:bg-amber-900 text-amber-300 rounded-lg transition-colors"
            >
              Profile C (Minimal)
            </button>
            <button
              onClick={() => prefillOnly(PROFILE_CONSUMER, 'Consumer')}
              className="px-4 py-2 bg-pink-900/50 hover:bg-pink-900 text-pink-300 rounded-lg transition-colors"
            >
              Consumer Profile
            </button>
            <button
              onClick={() => prefillOnly(PROFILE_BUILDER, 'Builder')}
              className="px-4 py-2 bg-sky-900/50 hover:bg-sky-900 text-sky-300 rounded-lg transition-colors"
            >
              Builder Profile
            </button>
            <button
              onClick={computeDebugInfo}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Compute (Current Answers)
            </button>
            <button
              onClick={handleShuffleSeed}
              className="px-4 py-2 bg-blue-900/50 hover:bg-blue-900 text-blue-300 rounded-lg transition-colors"
            >
              Shuffle Seed {shuffleSeed ? `(${shuffleSeed})` : ''}
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-cyan-900/50 hover:bg-cyan-900 text-cyan-300 rounded-lg transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={run20Shuffles}
              className="px-4 py-2 bg-orange-900/50 hover:bg-orange-900 text-orange-300 rounded-lg transition-colors"
            >
              Run 20 Shuffles
            </button>
            <Link
              href="/results"
              className="px-4 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-900 text-fuchsia-300 rounded-lg transition-colors"
            >
              View Results →
            </Link>
          </div>
        </div>

        {/* Confidence & Red Flags */}
        {(confidence || redFlags.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Confidence */}
            {confidence && (
              <div
                className={`border rounded-xl p-4 ${
                  confidence.level === 'high'
                    ? 'bg-emerald-900/20 border-emerald-800'
                    : confidence.level === 'medium'
                      ? 'bg-amber-900/20 border-amber-800'
                      : 'bg-red-900/20 border-red-800'
                }`}
              >
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      confidence.level === 'high'
                        ? 'bg-emerald-400'
                        : confidence.level === 'medium'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                    }`}
                  />
                  Confidence: {confidence.level.toUpperCase()}
                </h3>
                <p className="text-xs text-zinc-400">{confidence.explanation}</p>
                <p className="text-xs text-zinc-500 mt-1">Gap: {confidence.gap} points</p>
              </div>
            )}

            {/* Red Flags */}
            {redFlags.length > 0 && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2 text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Red Flags ({redFlags.length})
                </h3>
                <ul className="space-y-1">
                  {redFlags.map((flag, i) => (
                    <li key={i} className="text-xs text-red-300">
                      • {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Shuffle Analysis */}
        {shuffleAnalysis && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Shuffle Analysis ({shuffleAnalysis.totalRuns} runs)
            </h2>

            {/* Check for dominant winner (>40%) */}
            {(() => {
              const entries = Object.entries(shuffleAnalysis.winnerCounts).sort((a, b) => b[1] - a[1])
              const topWinner = entries[0]
              const topPercent = topWinner ? Math.round((topWinner[1] / shuffleAnalysis.totalRuns) * 100) : 0
              const isDominant = topPercent > 40

              return (
                <>
                  {isDominant && (
                    <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Dominant Winner Detected
                      </div>
                      <p className="text-xs text-amber-300 mt-1">
                        &quot;{topWinner[0]}&quot; wins {topPercent}% of shuffles. This may indicate insufficient differentiation for this profile.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {entries.map(([name, count], i) => {
                      const percent = Math.round((count / shuffleAnalysis.totalRuns) * 100)
                      return (
                        <div key={name} className="flex items-center gap-3">
                          <div className="w-8 text-zinc-500 text-xs text-right">#{i + 1}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-zinc-200">{name}</span>
                              <span className="text-xs text-zinc-400">{count} wins ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  percent > 40 ? 'bg-amber-500' : percent > 20 ? 'bg-violet-500' : 'bg-zinc-600'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                    <p>Unique winners: {entries.length}</p>
                    <p>Most frequent: {topWinner?.[0]} ({topPercent}%)</p>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Current Answers */}
        {currentAnswers && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Current Quiz Answers</h2>
            <pre className="bg-zinc-950 p-4 rounded-lg text-xs overflow-auto max-h-48">
              {JSON.stringify(currentAnswers, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Panel - FitProfile */}
        {debugProfile && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Computed FitProfile</h2>
            <pre className="bg-zinc-950 p-4 rounded-lg text-xs overflow-auto max-h-64">
              {JSON.stringify(debugProfile, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Panel - Ranked Candidates */}
        {debugResults.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Top {debugResults.length} Ranked Candidates</h2>
            <div className="space-y-4">
              {debugResults.map((result, i) => (
                <div key={result.id} className="bg-zinc-950 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0
                          ? 'bg-violet-900/50 text-violet-400'
                          : i === 1
                            ? 'bg-zinc-700 text-zinc-300'
                            : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{result.name}</div>
                      <div className="text-xs text-zinc-500">
                        ID: {result.id} | Total Score:{' '}
                        <span className="text-violet-400 font-bold">{result.score}</span>
                        {result.breakdown?.wasCapped && (
                          <span className="ml-2 text-amber-400">(capped)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  {result.breakdown && (
                    <div className="bg-zinc-900/50 rounded-lg p-3 mt-3 mb-3">
                      <div className="text-xs text-zinc-400 font-medium mb-2">Score Breakdown</div>
                      <div className="grid grid-cols-8 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-zinc-500">Base</div>
                          <div className="text-zinc-200 font-mono">{result.breakdown.baseFit}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-zinc-500">Interest</div>
                          <div className="text-emerald-400 font-mono">+{result.breakdown.interestBoost}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-zinc-500">Avoid</div>
                          <div className="text-orange-400 font-mono">-{result.breakdown.avoidPenalty}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-zinc-500">Dist</div>
                          <div className="text-blue-400 font-mono">+{result.breakdown.distributionBoost}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-zinc-500">Quit</div>
                          <div className="text-amber-400 font-mono">+{result.breakdown.quitReasonBoost}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-zinc-500">Credibility</div>
                          <div className="text-red-400 font-mono">-{result.breakdown.credibilityPenalty}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-zinc-500">Audience</div>
                          <div className="text-pink-400 font-mono">-{result.breakdown.audiencePenalty}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-zinc-500">Delivery</div>
                          <div className={`font-mono ${result.breakdown.deliveryBoost >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {result.breakdown.deliveryBoost >= 0 ? '+' : ''}{result.breakdown.deliveryBoost}
                          </div>
                        </div>
                      </div>

                      {/* Credibility flags inline */}
                      {result.breakdown.credibilityFlags && result.breakdown.credibilityFlags.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-zinc-800">
                          <div className="text-xs text-red-400">
                            {result.breakdown.credibilityFlags.map((flag, j) => (
                              <div key={j}>⚠ {flag}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500">How you&apos;d get users:</span>{' '}
                      <span className="text-zinc-300">{result.distributionType}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Support Level:</span>{' '}
                      <span className="text-zinc-300">{result.supportLevel}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Audience Mode:</span>{' '}
                      <span className={`font-medium ${
                        result.audienceMode === 'consumer' ? 'text-pink-400' :
                        result.audienceMode === 'builder' ? 'text-sky-400' :
                        'text-zinc-300'
                      }`}>{result.audienceMode}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Delivery:</span>{' '}
                      <span className={`font-medium ${
                        result.deliveryMode === 'online_only' ? 'text-emerald-400' :
                        'text-red-400'
                      }`}>{result.deliveryMode}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.matchChips.map((chip, j) => (
                      <span
                        key={j}
                        className="px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 text-xs"
                      >
                        ✓ {chip}
                      </span>
                    ))}
                    {result.avoidChips.map((chip, j) => (
                      <span
                        key={`avoid-${j}`}
                        className="px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 text-xs"
                      >
                        ⊘ {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 text-xs text-zinc-600">
          <p>Quiz questions: {QUIZ_QUESTIONS.length}</p>
          <p>Library candidates: {library.candidates.length}</p>
          <p>
            Tags coverage:{' '}
            {Math.round(
              (library.candidates.filter(
                (c: CandidateWithTags) =>
                  c.interest_tags && c.interest_tags.length > 0 && c.avoid_tags && c.avoid_tags.length > 0
              ).length /
                library.candidates.length) *
                100
            )}
            %
          </p>
        </div>
      </div>
    </div>
  )
}
