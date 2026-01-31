'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QUIZ_QUESTIONS, QuizAnswers } from '@/lib/quiz-questions'
import {
  rankIdeas,
  RankedIdea,
  FitProfile,
  generateMatchChips,
  MatchChip,
  calculateConfidence,
  findWildcard,
  distributionTypeLabels,
  supportLevelLabels,
  getIdeaById,
} from '@/lib/fit-algorithm'

const STORAGE_KEY = 'ideafit-quiz-answers'

// Candidate type with proof data
interface CandidateProof {
  distribution_type?: string
  support_level?: string
  timebox_days?: number
  competitors?: Array<{ name: string; price: string; gap: string }>
  voc_quotes?: Array<{ quote: string; source: string; pain_tag?: string }>
  mvp_in?: string[]
  wedge?: string
}

// Truncate text with ellipsis
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Result card component for consistent display
function ResultCard({
  idea,
  rank,
  badge,
  badgeColor,
  chips,
}: {
  idea: RankedIdea
  rank: number
  badge: string
  badgeColor: string
  chips: MatchChip[]
}) {
  // Expand/collapse state for proof sections
  const [showMoreCompetitors, setShowMoreCompetitors] = useState(false)
  const [showMoreVoc, setShowMoreVoc] = useState(false)
  const [showMoreMvp, setShowMoreMvp] = useState(false)

  const candidate = getIdeaById(idea.id) as CandidateProof | undefined

  const distType = candidate?.distribution_type || 'organic'
  const supportLevel = candidate?.support_level || 'medium'
  const timeboxDays = candidate?.timebox_days || 14
  const competitors = candidate?.competitors || []
  const vocQuotes = candidate?.voc_quotes || []
  const mvpIn = candidate?.mvp_in || []

  const matchChips = chips.filter((c) => c.type === 'match').slice(0, 3)
  const avoidChips = chips.filter((c) => c.type === 'avoided').slice(0, 2)

  // Get first VoC quote - show pain_tag first (short), full quote on expand
  const firstVoc = vocQuotes[0]
  const vocPainLine = firstVoc?.pain_tag || (firstVoc ? truncate(firstVoc.quote, 60) : null)
  const vocFullText = firstVoc ? truncate(firstVoc.quote, 120) : null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
            rank === 1
              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
              : rank === 2
                ? 'bg-zinc-700'
                : 'bg-gradient-to-br from-amber-500 to-orange-500'
          }`}
        >
          #{rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}
            >
              {badge}
            </span>
            <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
              {idea.track}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">{idea.name}</h3>

          {/* Score bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                style={{ width: `${idea.score}%` }}
              />
            </div>
            <span className="text-sm font-medium text-violet-400">{idea.score}%</span>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-3">
            <span>
              <span className="text-zinc-400">Timeline:</span> {timeboxDays} days
            </span>
            <span>
              <span className="text-zinc-400">How you&apos;d get users:</span>{' '}
              {distributionTypeLabels[distType] || distType}
            </span>
            <span>
              <span className="text-zinc-400">Support:</span>{' '}
              {supportLevelLabels[supportLevel] || supportLevel}
            </span>
          </div>

          {/* Match chips */}
          {(matchChips.length > 0 || avoidChips.length > 0) && (
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Why this matches you</p>
              <div className="flex flex-wrap gap-2">
                {matchChips.map((chip, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 text-xs font-medium"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {chip.label}
                  </span>
                ))}
                {avoidChips.map((chip, i) => (
                  <span
                    key={`avoided-${i}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 text-xs font-medium"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Proof Preview Section */}
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
            {/* Competitor snapshot - show 1 by default */}
            {competitors.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Competitors
                </p>
                <div className="space-y-1.5">
                  {/* Always show first competitor */}
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-zinc-300 font-medium shrink-0">{competitors[0].name}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">{competitors[0].price}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400 italic">{truncate(competitors[0].gap, 50)}</span>
                  </div>
                  {/* Show 2nd competitor when expanded */}
                  {showMoreCompetitors && competitors[1] && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-zinc-300 font-medium shrink-0">{competitors[1].name}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-500">{competitors[1].price}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400 italic">{truncate(competitors[1].gap, 50)}</span>
                    </div>
                  )}
                  {/* Expand link */}
                  {competitors.length > 1 && !showMoreCompetitors && (
                    <button
                      onClick={() => setShowMoreCompetitors(true)}
                      className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
                    >
                      Show 2nd competitor
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Real user quote - show pain line by default */}
            {vocPainLine && firstVoc && (
              <div>
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Real user quote
                </p>
                <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
                  {showMoreVoc ? (
                    <>
                      <p className="text-xs text-zinc-300 italic">&ldquo;{vocFullText}&rdquo;</p>
                      <p className="text-xs text-zinc-500 mt-1">— {firstVoc.source}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-300 italic">&ldquo;{vocPainLine}&rdquo;</p>
                      {vocFullText && vocFullText !== vocPainLine && (
                        <button
                          onClick={() => setShowMoreVoc(true)}
                          className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 mt-1"
                        >
                          More
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* MVP first steps - show 2 by default */}
            {mvpIn.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  First steps
                </p>
                <ul className="space-y-1">
                  {mvpIn.slice(0, showMoreMvp ? 3 : 2).map((step, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                      <span className="text-violet-400 shrink-0">•</span>
                      {step}
                    </li>
                  ))}
                </ul>
                {mvpIn.length > 2 && !showMoreMvp && (
                  <button
                    onClick={() => setShowMoreMvp(true)}
                    className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 mt-1"
                  >
                    Show all {Math.min(mvpIn.length, 3)}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResultsClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<QuizAnswers | null>(null)
  const [results, setResults] = useState<{
    profile: FitProfile
    rankedIdeas: RankedIdea[]
    fitTrack: string
    winnerId: string
  } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      router.push('/quiz')
      return
    }

    try {
      const parsed = JSON.parse(saved)
      const quizAnswers = parsed.answers || {}

      // Check if quiz is complete
      const answeredCount = Object.keys(quizAnswers).length
      if (answeredCount < QUIZ_QUESTIONS.length) {
        router.push('/quiz')
        return
      }

      setAnswers(quizAnswers)
      // Get top 10 for wildcard search
      const ranked = rankIdeas(quizAnswers, { limit: 10 })
      setResults(ranked)
    } catch {
      router.push('/quiz')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create report')
      }

      const { reportId } = await res.json()

      // Clear quiz answers from localStorage
      localStorage.removeItem(STORAGE_KEY)

      // Redirect to preview page
      router.push(`/preview/${reportId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const topMatch = results.rankedIdeas[0]
  const runnerUp = results.rankedIdeas[1]
  const wildcard = findWildcard(results.rankedIdeas.slice(2), topMatch.track)

  // Calculate confidence
  const confidence = calculateConfidence(topMatch.score, runnerUp?.score || 0)

  // Generate chips for each result
  const topChips = generateMatchChips(results.profile, topMatch.id)
  const runnerUpChips = runnerUp ? generateMatchChips(results.profile, runnerUp.id) : []
  const wildcardChips = wildcard ? generateMatchChips(results.profile, wildcard.id) : []

  // Wildcard rank in original list
  const wildcardRank = wildcard
    ? results.rankedIdeas.findIndex((r) => r.id === wildcard.id) + 1
    : 0

  const confidenceColors = {
    high: 'bg-emerald-900/30 border-emerald-800 text-emerald-400',
    medium: 'bg-amber-900/30 border-amber-800 text-amber-400',
    low: 'bg-red-900/30 border-red-800 text-red-400',
  }

  const confidenceIcons = {
    high: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    medium: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    low: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              IF
            </div>
            <span className="text-xl font-semibold text-zinc-100">IdeaFit</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Results header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Quiz Complete
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">Your Matches</h1>
          <p className="text-zinc-400">Based on your {QUIZ_QUESTIONS.length} answers, here are your best startup ideas.</p>
        </div>

        {/* Confidence indicator */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-8 ${confidenceColors[confidence.level]}`}
        >
          {confidenceIcons[confidence.level]}
          <div>
            <span className="font-medium capitalize">{confidence.level} Confidence</span>
            <p className="text-sm opacity-80">{confidence.explanation}</p>
          </div>
        </div>

        {/* Results cards */}
        <div className="space-y-4 mb-8">
          {/* Top Match */}
          <ResultCard
            idea={topMatch}
            rank={1}
            badge="Top Match"
            badgeColor="bg-violet-900/50 text-violet-400"
            chips={topChips}
          />

          {/* Runner-up */}
          {runnerUp && (
            <ResultCard
              idea={runnerUp}
              rank={2}
              badge="Runner-up"
              badgeColor="bg-zinc-700 text-zinc-300"
              chips={runnerUpChips}
            />
          )}

          {/* Wildcard */}
          {wildcard && (
            <ResultCard
              idea={wildcard}
              rank={wildcardRank}
              badge="Wildcard"
              badgeColor="bg-amber-900/50 text-amber-400"
              chips={wildcardChips}
            />
          )}
        </div>

        {/* What's in the report */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            What&apos;s in your full report
          </h3>
          <div className="space-y-3">
            {[
              'Detailed Fit Profile analysis',
              'All 5 matched ideas with full breakdowns',
              'Competitor analysis & pricing data',
              'Real user quotes',
              'Complete MVP specification',
              'Ship plan with Claude AI prompts',
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg"
              >
                <div className="w-5 h-5 rounded-full bg-violet-900/50 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <span className="text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Email gate */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-zinc-100 mb-2 text-center">
            Enter your email to continue
          </h3>
          <p className="text-sm text-zinc-500 mb-6 text-center">
            We&apos;ll save your results and send you a magic link to access your report anytime.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full py-3 rounded-xl font-semibold transition-all bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating your report...' : 'Continue to Report Preview'}
            </button>
          </form>

          <p className="text-xs text-zinc-600 text-center mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </main>
    </div>
  )
}
