'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QUIZ_QUESTIONS, QuizAnswers } from '@/lib/quiz-questions'
import { rankIdeas, RankedIdea, FitProfile, generateMatchChips, MatchChip } from '@/lib/fit-algorithm'

const STORAGE_KEY = 'ideafit-quiz-answers'

export default function ResultsPage() {
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
  const [matchChips, setMatchChips] = useState<MatchChip[]>([])

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
      const ranked = rankIdeas(quizAnswers)
      setResults(ranked)
      // Generate match chips for the winner
      const chips = generateMatchChips(ranked.profile, ranked.winnerId)
      setMatchChips(chips)
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

  const winner = results.rankedIdeas[0]

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
        {/* Results preview */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Quiz Complete
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
            Your Top Match
          </h1>
          <p className="text-zinc-400">
            Based on your answers, we found your ideal startup idea.
          </p>
        </div>

        {/* Winner preview card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
              #1
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium mb-2">
                {winner.track}
              </span>
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                {winner.name}
              </h2>
              <p className="text-sm text-zinc-400 mb-3">
                {winner.reason}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    style={{ width: `${winner.score}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-violet-400">
                  {winner.score}% match
                </span>
              </div>

              {/* Match chips */}
              {matchChips.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Why this matches you</p>
                  <div className="flex flex-wrap gap-2">
                    {matchChips.filter(c => c.type === 'match').map((chip, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-900/40 text-violet-300 text-xs font-medium"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {chip.label}
                      </span>
                    ))}
                    {matchChips.filter(c => c.type === 'avoided').map((chip, i) => (
                      <span
                        key={`avoided-${i}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-300 text-xs font-medium"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        {chip.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* What's in the report (blurred preview) */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            What&apos;s in your full report
          </h3>
          <div className="space-y-3">
            {[
              'Detailed Fit Profile analysis',
              '4 more matched ideas with scores',
              'Competitor analysis & pricing data',
              'Voice of Customer quotes',
              'Complete MVP specification',
              '14-day ship plan with Claude prompts',
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg"
              >
                <div className="w-5 h-5 rounded-full bg-violet-900/50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full py-3 rounded-xl font-semibold transition-all bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating your report...' : 'Continue to Report Preview'}
            </button>
          </form>

          <p className="text-xs text-zinc-600 text-center mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </main>
    </div>
  )
}
