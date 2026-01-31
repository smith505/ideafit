import { Suspense } from 'react'
import Link from 'next/link'
import QuizClient from './quiz-client'

function QuizSkeleton() {
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
          <span className="text-sm text-zinc-500">1 of 10</span>
        </div>
      </header>

      {/* Progress bar skeleton */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-[10%] bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        </div>
      </div>

      {/* Loading content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-zinc-400 text-lg">Loading quiz…</p>
        </div>

        {/* Skeleton question placeholders for SEO */}
        <div className="sr-only">
          <h1>Quick Fit Quiz</h1>
          <p>Answer 10 quick questions about your time, skills, and goals to find your best startup idea match.</p>
          <ul>
            <li>How many hours per week can you dedicate?</li>
            <li>What is your technical background?</li>
            <li>What revenue goal are you targeting?</li>
            <li>How do you prefer to build?</li>
            <li>What usually makes you quit a side project?</li>
            <li>How comfortable are you getting customers?</li>
          </ul>
        </div>
      </main>

      {/* noscript fallback */}
      <noscript>
        <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
              IF
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-4">JavaScript Required</h1>
            <p className="text-zinc-400 mb-6">
              Please enable JavaScript to take the IdeaFit quiz. The quiz uses interactive features that require JavaScript to work properly.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300"
            >
              ← Return to homepage
            </a>
          </div>
        </div>
      </noscript>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<QuizSkeleton />}>
      <QuizClient />
    </Suspense>
  )
}
