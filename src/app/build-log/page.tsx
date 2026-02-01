import Link from 'next/link'
import { Metadata } from 'next'
import { BUILD_LOG_ENTRIES } from '@/lib/build-log-entries'
import { CreatorFooter } from '@/components/creator-footer'
import { BuildVersion } from '@/components/build-version'

export const metadata: Metadata = {
  title: 'Build Log | IdeaMatch',
  description: 'What I shipped and when. Building in public.',
}

// Force dynamic to show latest build SHA
export const dynamic = 'force-dynamic'

export default function BuildLogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              IM
            </div>
            <span className="text-xl font-semibold text-gray-900">IdeaMatch</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/quiz" className="text-violet-600 hover:text-violet-700">
              Take Quiz
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Log</h1>
          <p className="text-gray-600">What I shipped and when. Building in public.</p>
          <div className="mt-4">
            <BuildVersion />
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-6">
          {BUILD_LOG_ENTRIES.map((entry, i) => (
            <div
              key={entry.date}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">{entry.title}</h2>
                <span className="text-xs text-gray-500 font-mono">{entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.bullets.map((bullet, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-violet-500 mt-0.5">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
              {i === 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-emerald-600 font-medium">Latest</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="text-gray-300">·</span>
            <Link href="/quiz" className="hover:text-gray-900 transition-colors">Take Quiz</Link>
            <span className="text-gray-300">·</span>
            <Link href="/about" className="hover:text-gray-900 transition-colors">About</Link>
          </div>
          <CreatorFooter />
        </footer>
      </main>
    </div>
  )
}
