'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QUIZ_QUESTIONS, QuizAnswers } from '@/lib/quiz-questions'
import { BuildVersion } from '@/components/build-version'
import { CreatorFooter } from '@/components/creator-footer'
import { trackEvent, getOrCreateSessionId } from '@/lib/analytics-client'

const STORAGE_KEY = 'ideamatch-quiz-answers'

export default function QuizClient() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [isLoaded, setIsLoaded] = useState(false)
  const [textValue, setTextValue] = useState('')
  const startTrackedRef = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    // Ensure session ID exists
    getOrCreateSessionId()

    const saved = localStorage.getItem(STORAGE_KEY)
    let isResuming = false
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const savedAnswers = parsed.answers || {}
        const savedIndex = parsed.currentIndex || 0
        setAnswers(savedAnswers)
        setCurrentIndex(savedIndex)
        // Consider it resuming if they have any answers
        isResuming = Object.keys(savedAnswers).length > 0
      } catch {
        // Invalid data, start fresh
      }
    }

    // Track quiz start only once and only if not resuming
    if (!startTrackedRef.current && !isResuming) {
      startTrackedRef.current = true
      trackEvent('start_quiz')
    }

    setIsLoaded(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, currentIndex }))
    }
  }, [answers, currentIndex, isLoaded])

  // Sync text value when navigating to text question
  useEffect(() => {
    const currentQuestion = QUIZ_QUESTIONS[currentIndex]
    if (currentQuestion?.type === 'text') {
      setTextValue((answers[currentQuestion.id] as string) || '')
    }
  }, [currentIndex, answers])

  const currentQuestion = QUIZ_QUESTIONS[currentIndex]
  const totalQuestions = QUIZ_QUESTIONS.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const maxSelections = currentQuestion?.maxSelections || 3

  const handleSelect = (value: string) => {
    if (currentQuestion.type === 'single') {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
    } else if (currentQuestion.type === 'multi') {
      // Multi-select toggle with configurable max
      const current = (answers[currentQuestion.id] as string[]) || []
      if (current.includes(value)) {
        // Remove
        const updated = current.filter((v) => v !== value)
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: updated }))
      } else if (current.length < maxSelections) {
        // Add only if under limit
        const updated = [...current, value]
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: updated }))
      }
    }
  }

  const handleTextChange = (value: string) => {
    const maxLen = currentQuestion.maxLength || 200
    const trimmed = value.slice(0, maxLen)
    setTextValue(trimmed)
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: trimmed }))
  }

  const isSelected = (value: string) => {
    const answer = answers[currentQuestion.id]
    if (currentQuestion.type === 'single') {
      return answer === value
    }
    return Array.isArray(answer) && answer.includes(value)
  }

  const canProceed = () => {
    if (currentQuestion.type === 'text') {
      return true // Text is always optional
    }
    const answer = answers[currentQuestion.id]
    if (currentQuestion.type === 'single') {
      return !!answer
    }
    return Array.isArray(answer) && answer.length > 0
  }

  const getMultiSelectCount = () => {
    const answer = answers[currentQuestion.id]
    if (Array.isArray(answer)) {
      return answer.length
    }
    return 0
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Quiz complete - track and go to results
      const audienceMode = answers.audience_mode as string
      trackEvent('complete_quiz', { audienceMode })
      router.push('/results')
    }
  }

  const handleSkip = () => {
    // Clear any answer for this question and move on
    setAnswers((prev) => {
      const updated = { ...prev }
      delete updated[currentQuestion.id]
      return updated
    })
    if (currentQuestion.type === 'text') {
      setTextValue('')
    }
    handleNext()
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  // Calculate time remaining estimate
  const getTimeRemaining = () => {
    const remaining = totalQuestions - currentIndex - 1
    if (remaining <= 3) return '~30 sec left'
    if (remaining <= 5) return '~1 min left'
    return null
  }

  if (!isLoaded) {
    return null // Server skeleton will show until hydration completes
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              IM
            </div>
            <span className="text-xl font-semibold text-zinc-100">IdeaMatch</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              {currentIndex + 1} of {totalQuestions}
            </span>
            {currentIndex === 0 ? (
              <span className="text-xs text-zinc-500">~7 min total</span>
            ) : getTimeRemaining() ? (
              <span className="text-xs text-violet-400">{getTimeRemaining()}</span>
            ) : null}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-zinc-600">Saved automatically</span>
          <span className="text-xs text-zinc-600">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Question */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-2">
          {currentQuestion.question}
        </h1>

        {currentQuestion.helperText && (
          <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
            {currentQuestion.helperText}
          </p>
        )}

        {currentQuestion.type === 'text' && (
          <p className="text-sm text-zinc-500 mb-6">
            Optional - 1-2 sentences max
          </p>
        )}

        {currentQuestion.type === 'multi' && (
          <p className="text-sm text-zinc-500 mb-6">
            Select up to {maxSelections} ({getMultiSelectCount()}/{maxSelections} selected)
          </p>
        )}

        {currentQuestion.type === 'single' && <div className="mb-6" />}

        {/* Text input for 'text' type */}
        {currentQuestion.type === 'text' && (
          <div className="space-y-3">
            <textarea
              value={textValue}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              maxLength={currentQuestion.maxLength || 200}
              className="w-full px-5 py-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <span className="text-xs text-zinc-600">
                {textValue.length}/{currentQuestion.maxLength || 200}
              </span>
            </div>
          </div>
        )}

        {/* Options for single/multi type */}
        {currentQuestion.type !== 'text' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const selected = isSelected(option.value)
              const atLimit = currentQuestion.type === 'multi' && getMultiSelectCount() >= maxSelections && !selected

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  disabled={atLimit}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                    selected
                      ? 'border-violet-500 bg-violet-500/10 text-zinc-100'
                      : atLimit
                        ? 'border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-${currentQuestion.type === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center ${
                        selected
                          ? 'border-violet-500 bg-violet-500'
                          : 'border-zinc-600'
                      }`}
                    >
                      {selected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span>{option.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={`px-6 py-3 rounded-full font-medium transition-colors ${
              currentIndex === 0
                ? 'text-zinc-600 cursor-not-allowed'
                : 'text-zinc-300 hover:text-zinc-100'
            }`}
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            {currentQuestion.skippable && (
              <button
                onClick={handleSkip}
                className="px-6 py-3 rounded-full font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed() && !currentQuestion.skippable}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                canProceed() || currentQuestion.skippable
                  ? 'bg-violet-600 hover:bg-violet-500 text-white'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {currentIndex === totalQuestions - 1 ? 'See Results' : 'Next'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-6 pb-6 text-center space-y-3">
        <CreatorFooter />
        <BuildVersion />
      </footer>
    </div>
  )
}
