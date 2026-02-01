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
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Check your email
        </h1>
        <p className="text-gray-600 mb-6">
          If you have an existing report, we&apos;ve sent a magic link to{' '}
          <span className="text-gray-900">{email}</span>.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
        </p>
        <button
          onClick={() => {
            setIsSent(false)
            setEmail('')
          }}
          className="text-violet-600 hover:text-violet-700 text-sm"
        >
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Access your report
      </h1>
      <p className="text-gray-600 text-center mb-8">
        Enter the email you used to create your report and we&apos;ll send you a magic link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
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
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl disabled:bg-gray-200 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isSubmitting ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          Don&apos;t have a report yet?{' '}
          <Link href="/quiz" className="text-violet-600 hover:text-violet-700">
            Take the free quiz
          </Link>
        </p>
      </div>
    </div>
  )
}
