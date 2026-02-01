import Link from 'next/link'
import { Metadata } from 'next'
import { CREATOR_NAME, CREATOR_SITE, CREATOR_X, CREATOR_NEWSLETTER } from '@/lib/creator'
import { CreatorFooter } from '@/components/creator-footer'

export const metadata: Metadata = {
  title: 'About | IdeaFit',
  description: 'Learn about IdeaFit and the person behind it.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              IF
            </div>
            <span className="text-xl font-semibold text-zinc-100">IdeaFit</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/build-log" className="text-zinc-400 hover:text-zinc-300">
              Build Log
            </Link>
            <Link href="/quiz" className="text-violet-400 hover:text-violet-300">
              Take Quiz
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* About Cory */}
        <section className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-100 mb-6">About</h1>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Who I Am</h2>
            <p className="text-zinc-400 mb-4">
              I&apos;m {CREATOR_NAME}. I build small software products and share the process publicly.
            </p>
            <p className="text-zinc-400 mb-4">
              IdeaFit is my attempt to solve a problem I&apos;ve had for years: too many ideas,
              not enough clarity on which one fits my current constraints. I built this to
              help myself — and hopefully you — stop second-guessing and start shipping.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <a
                href={CREATOR_X}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                Follow on X →
              </a>
              <a
                href={CREATOR_NEWSLETTER}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                Newsletter →
              </a>
              <a
                href={CREATOR_SITE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                Website →
              </a>
            </div>
          </div>
        </section>

        {/* About IdeaFit */}
        <section className="mb-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">What IdeaFit Is</h2>
            <p className="text-zinc-400 mb-4">
              IdeaFit is a quiz-to-report tool that matches you to validated startup ideas
              based on your time, skills, and goals. No more endless browsing through
              &ldquo;startup idea&rdquo; threads. Take a 7-minute quiz and get a personalized report
              with your top matches, competitor analysis, real user quotes, and a 14-day ship plan.
            </p>
            <div className="space-y-2 text-sm text-zinc-400">
              <p><strong className="text-zinc-300">Quiz:</strong> Free, ~7 minutes</p>
              <p><strong className="text-zinc-300">Report:</strong> $49 one-time, includes 5 regenerations</p>
              <p><strong className="text-zinc-300">Guarantee:</strong> 3+ competitors, 3+ real user quotes, clear positioning — or refund within 7 days</p>
            </div>
          </div>
        </section>

        {/* Sample Report */}
        <section className="mb-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Want to see what you get?</h2>
            <p className="text-zinc-400 mb-4 text-sm">
              Check out a sample report to see exactly what&apos;s included.
            </p>
            <a
              href="/sample-report-v1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Sample Report (PDF)
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-zinc-800 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
            <span className="text-zinc-700">·</span>
            <Link href="/quiz" className="hover:text-zinc-300 transition-colors">Take Quiz</Link>
            <span className="text-zinc-700">·</span>
            <Link href="/build-log" className="hover:text-zinc-300 transition-colors">Build Log</Link>
          </div>
          <CreatorFooter />
        </footer>
      </main>
    </div>
  )
}
