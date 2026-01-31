'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AccessForm() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // Always show success to prevent email enumeration
      setIsSent(true)
    } catch {
      setIsSent(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
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
          If you have an existing report, we&apos;ve sent a magic link to{' '}
          <span className="text-zinc-100">{email}</span>.
        </p>
        <p className="text-sm text-zinc-500 mb-6">
          The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
        </p>
        <button
          onClick={() => {
            setIsSent(false)
            setEmail('')
          }}
          className="text-violet-400 hover:text-violet-300 text-sm"
        >
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
      <h1 className="text-2xl font-bold text-zinc-100 mb-2 text-center">
        Access your report
      </h1>
      <p className="text-zinc-400 text-center mb-8">
        Enter the email you used to create your report and we&apos;ll send you a magic link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

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
            Take the free quiz
          </Link>
        </p>
      </div>
    </div>
  )
}
