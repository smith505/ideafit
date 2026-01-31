'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QUIZ_QUESTIONS, QuizAnswers } from '@/lib/quiz-questions'

const STORAGE_KEY = 'ideafit-quiz-answers'

export default function QuizPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAnswers(parsed.answers || {})
        setCurrentIndex(parsed.currentIndex || 0)
      } catch {
        // Invalid data, start fresh
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, currentIndex }))
    }
  }, [answers, currentIndex, isLoaded])

  const currentQuestion = QUIZ_QUESTIONS[currentIndex]
  const progress = ((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100

  const handleSelect = (value: string) => {
    if (currentQuestion.type === 'single') {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
    } else {
      // Multi-select toggle
      const current = (answers[currentQuestion.id] as string[]) || []
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: updated }))
    }
  }

  const isSelected = (value: string) => {
    const answer = answers[currentQuestion.id]
    if (currentQuestion.type === 'single') {
      return answer === value
    }
    return Array.isArray(answer) && answer.includes(value)
  }

  const canProceed = () => {
    const answer = answers[currentQuestion.id]
    if (currentQuestion.type === 'single') {
      return !!answer
    }
    return Array.isArray(answer) && answer.length > 0
  }

  const handleNext = () => {
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Quiz complete, go to results
      router.push('/results')
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
          <span className="text-sm text-zinc-500">
            {currentIndex + 1} of {QUIZ_QUESTIONS.length}
          </span>
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
      </div>

      {/* Question */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-8">
          {currentQuestion.question}
        </h1>

        {currentQuestion.type === 'multi' && (
          <p className="text-sm text-zinc-500 mb-6">Select all that apply</p>
        )}

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                isSelected(option.value)
                  ? 'border-violet-500 bg-violet-500/10 text-zinc-100'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-${currentQuestion.type === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center ${
                    isSelected(option.value)
                      ? 'border-violet-500 bg-violet-500'
                      : 'border-zinc-600'
                  }`}
                >
                  {isSelected(option.value) && (
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
          ))}
        </div>

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

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-8 py-3 rounded-full font-semibold transition-all ${
              canProceed()
                ? 'bg-violet-600 hover:bg-violet-500 text-white'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {currentIndex === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  )
}
