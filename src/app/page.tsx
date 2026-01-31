'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setIsSent(true)
      }
    } catch {
      // Silently fail - still show success to prevent email enumeration
      setIsSent(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              IF
            </div>
            <span className="text-xl font-semibold text-zinc-100">IdeaFit</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowAccessModal(true)}
              className="text-sm text-zinc-400 hover:text-zinc-300"
            >
              Access Report
            </button>
            <Link
              href="/quiz"
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              Take the Quiz →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-6 leading-tight">
          Find Your Best Startup Idea
          <br />
          <span className="text-violet-400">in 7 Minutes</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Stop second-guessing. Take the Quick Fit Quiz and get a personalized report
          with your top idea, validation data, and a 14-day ship plan.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors"
          >
            Take the Quick Fit Quiz
            <span className="text-violet-200">— Free</span>
          </Link>
          <Link
            href="/sample-report.pdf"
            target="_blank"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-300 font-medium px-4 py-3 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Sample Report (PDF)
          </Link>
        </div>
        <p className="text-sm text-zinc-500 mt-4">
          5-7 minutes · No account required
        </p>
      </section>

      {/* What You Get */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-zinc-100 mb-10 text-center">
          What You&apos;ll Get
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-violet-900/50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Fit Profile</h3>
            <p className="text-zinc-400 text-sm">
              Understand your ideal idea type based on time, skills, and goals.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Winner Idea + Validation</h3>
            <p className="text-zinc-400 text-sm">
              Your top-matched idea with competitors, VoC quotes, and market signals.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-amber-900/50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">14-Day Ship Plan</h3>
            <p className="text-zinc-400 text-sm">
              Day-by-day tasks with acceptance criteria. Plus Claude prompts for your stack.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-800">
        <h2 className="text-2xl font-bold text-zinc-100 mb-10 text-center">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Take Quiz', desc: '8 questions about your time, skills, and goals' },
            { step: '2', title: 'Get Matched', desc: 'AI matches you to ideas from our validated library' },
            { step: '3', title: 'Preview & Unlock', desc: 'See your top match free, then unlock full report for $49' },
            { step: '4', title: 'Start Building', desc: 'Follow the 14-day plan with Claude prompts' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-800 text-violet-400 font-bold flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-800">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">
            Full report unlock starts at $49 after your free quiz
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Take the quiz free, preview your top match, then decide if you want the full report.
          </p>

          {/* What's included */}
          <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto mb-8 text-left">
            {[
              'Complete Fit Profile analysis',
              'Top 5 matched ideas with scores',
              'Competitor & pricing research',
              'Voice of Customer quotes',
              'Full MVP specification',
              '14-day ship plan + Claude prompts',
              '5 regenerations included',
              'PDF export & 30-day access',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>

          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors"
          >
            Take Free Quiz (see preview)
          </Link>

          {/* Quality guarantee */}
          <p className="text-sm text-zinc-500 mt-6">
            <svg className="w-4 h-4 inline-block mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Not useful? Email us within 7 days for a full refund. No questions asked.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-zinc-600">
          © 2026 IdeaFit. Find your fit. Ship your idea.
        </div>
      </footer>

      {/* Access Report Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowAccessModal(false)
                setIsSent(false)
                setEmail('')
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {isSent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-900/50 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Check your email</h3>
                <p className="text-zinc-400 text-sm">
                  If you have an existing report, we&apos;ve sent a magic link to <span className="text-zinc-100">{email}</span>.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-zinc-100 mb-2 text-center">
                  Access your report
                </h3>
                <p className="text-zinc-400 text-sm mb-6 text-center">
                  Enter the email you used to create your report and we&apos;ll send you a magic link.
                </p>

                <form onSubmit={handleAccessSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full py-3 rounded-xl font-semibold transition-all bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </form>

                <p className="text-xs text-zinc-600 text-center mt-4">
                  Don&apos;t have a report yet?{' '}
                  <Link href="/quiz" className="text-violet-400 hover:text-violet-300">
                    Take the quiz
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
