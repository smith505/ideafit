'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QUIZ_QUESTIONS, QuizAnswers } from '@/lib/quiz-questions'
import { rankIdeas, buildFitProfile, generateMatchChips, getIdeaById } from '@/lib/fit-algorithm'
import library from '../../../data/library.json'

const STORAGE_KEY = 'ideafit-quiz-answers'

// Profile presets
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

const PROFILE_C: QuizAnswers = {
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

interface CandidateWithTags {
  id: string
  name: string
  interest_tags?: string[]
  avoid_tags?: string[]
  distribution_type?: string
  support_level?: string
}

export default function QAPage() {
  const router = useRouter()
  const [debugProfile, setDebugProfile] = useState<ReturnType<typeof buildFitProfile> | null>(null)
  const [debugResults, setDebugResults] = useState<Array<{
    id: string
    name: string
    score: number
    matchChips: string[]
    avoidChips: string[]
    distributionType: string
    supportLevel: string
  }>>([])
  const [currentAnswers, setCurrentAnswers] = useState<QuizAnswers | null>(null)

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

  const resetQuizState = () => {
    localStorage.removeItem(STORAGE_KEY)
    setCurrentAnswers(null)
    setDebugProfile(null)
    setDebugResults([])
    alert('Quiz state cleared!')
  }

  const prefillAndRoute = (profile: QuizAnswers, label: string) => {
    // Save to localStorage as if quiz was completed
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: profile,
      currentIndex: QUIZ_QUESTIONS.length - 1,
    }))
    setCurrentAnswers(profile)

    // Compute debug info
    const fitProfile = buildFitProfile(profile)
    setDebugProfile(fitProfile)

    const ranked = rankIdeas(profile)
    const debugData = ranked.rankedIdeas.map((idea) => {
      const chips = generateMatchChips(fitProfile, idea.id)
      const candidate = getIdeaById(idea.id) as CandidateWithTags | undefined
      return {
        id: idea.id,
        name: idea.name,
        score: idea.score,
        matchChips: chips.filter(c => c.type === 'match').map(c => c.label),
        avoidChips: chips.filter(c => c.type === 'avoided').map(c => c.label),
        distributionType: candidate?.distribution_type || 'n/a',
        supportLevel: candidate?.support_level || 'n/a',
      }
    })
    setDebugResults(debugData)

    // Navigate to results
    router.push('/results')
  }

  const computeDebugInfo = () => {
    if (!currentAnswers) {
      alert('No quiz answers in localStorage')
      return
    }

    const fitProfile = buildFitProfile(currentAnswers)
    setDebugProfile(fitProfile)

    const ranked = rankIdeas(currentAnswers)
    const debugData = ranked.rankedIdeas.map((idea) => {
      const chips = generateMatchChips(fitProfile, idea.id)
      const candidate = getIdeaById(idea.id) as CandidateWithTags | undefined
      return {
        id: idea.id,
        name: idea.name,
        score: idea.score,
        matchChips: chips.filter(c => c.type === 'match').map(c => c.label),
        avoidChips: chips.filter(c => c.type === 'avoided').map(c => c.label),
        distributionType: candidate?.distribution_type || 'n/a',
        supportLevel: candidate?.support_level || 'n/a',
      }
    })
    setDebugResults(debugData)
  }

  // Check if we're in development
  const isDev = process.env.NODE_ENV === 'development'

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
              onClick={() => prefillAndRoute(PROFILE_A, 'Profile A')}
              className="px-4 py-2 bg-violet-900/50 hover:bg-violet-900 text-violet-300 rounded-lg transition-colors"
            >
              Prefill Profile A (Tech + Career)
            </button>
            <button
              onClick={() => prefillAndRoute(PROFILE_B, 'Profile B')}
              className="px-4 py-2 bg-emerald-900/50 hover:bg-emerald-900 text-emerald-300 rounded-lg transition-colors"
            >
              Prefill Profile B (Home + Shopping)
            </button>
            <button
              onClick={() => prefillAndRoute(PROFILE_C, 'Profile C')}
              className="px-4 py-2 bg-amber-900/50 hover:bg-amber-900 text-amber-300 rounded-lg transition-colors"
            >
              Prefill Profile C (Minimal)
            </button>
            <button
              onClick={computeDebugInfo}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Compute Debug Info (Current Answers)
            </button>
          </div>
        </div>

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
                    <span className="w-8 h-8 rounded-full bg-violet-900/50 flex items-center justify-center text-violet-400 font-bold text-sm">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-xs text-zinc-500">
                        ID: {result.id} | Score: <span className="text-violet-400">{result.score}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                    <div>
                      <span className="text-zinc-500">Distribution:</span>{' '}
                      <span className="text-zinc-300">{result.distributionType}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Support Level:</span>{' '}
                      <span className="text-zinc-300">{result.supportLevel}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.matchChips.map((chip, j) => (
                      <span key={j} className="px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 text-xs">
                        ✓ {chip}
                      </span>
                    ))}
                    {result.avoidChips.map((chip, j) => (
                      <span key={`avoid-${j}`} className="px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 text-xs">
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
            Tags coverage: {Math.round(
              (library.candidates.filter((c: CandidateWithTags) =>
                c.interest_tags && c.interest_tags.length > 0 &&
                c.avoid_tags && c.avoid_tags.length > 0
              ).length / library.candidates.length) * 100
            )}%
          </p>
        </div>
      </div>
    </div>
  )
}
