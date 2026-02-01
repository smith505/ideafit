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
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              IM
            </div>
            <span className="text-xl font-semibold text-zinc-100">IdeaMatch</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/about" className="text-zinc-400 hover:text-zinc-300">
              About
            </Link>
            <Link href="/quiz" className="text-violet-400 hover:text-violet-300">
              Take Quiz
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Build Log</h1>
          <p className="text-zinc-400">What I shipped and when. Building in public.</p>
          <div className="mt-4">
            <BuildVersion />
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-6">
          {BUILD_LOG_ENTRIES.map((entry, i) => (
            <div
              key={entry.date}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-zinc-100">{entry.title}</h2>
                <span className="text-xs text-zinc-500 font-mono">{entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.bullets.map((bullet, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-violet-400 mt-0.5">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
              {i === 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <span className="text-xs text-emerald-400">Latest</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-zinc-800 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
            <span className="text-zinc-700">·</span>
            <Link href="/quiz" className="hover:text-zinc-300 transition-colors">Take Quiz</Link>
            <span className="text-zinc-700">·</span>
            <Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link>
          </div>
          <CreatorFooter />
        </footer>
      </main>
    </div>
  )
}
