'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        throw new Error('Failed to send magic link')
      }

      setIsSent(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
              IF
            </div>
            <span className="text-2xl font-semibold text-zinc-100">IdeaFit</span>
          </Link>
        </div>

        {isSent ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-900/50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-4">
              Check your email
            </h1>
            <p className="text-zinc-400 mb-6">
              We sent a magic link to <span className="text-zinc-100">{email}</span>.
              Click the link to access your report.
            </p>
            <p className="text-sm text-zinc-500">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                onClick={() => setIsSent(false)}
                className="text-violet-400 hover:text-violet-300"
              >
                try again
              </button>
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 text-center">
              Access your report
            </h1>
            <p className="text-zinc-400 text-center mb-8">
              Enter the email you used to create your report
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
                {isSubmitting ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
              <p className="text-sm text-zinc-500">
                Don&apos;t have a report yet?{' '}
                <Link href="/quiz" className="text-violet-400 hover:text-violet-300">
                  Take the quiz
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
