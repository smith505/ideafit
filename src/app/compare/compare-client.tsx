'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getIdeaById, distributionTypeLabels, supportLevelLabels } from '@/lib/fit-algorithm'
import { trackEvent, getOrCreateSessionId } from '@/lib/analytics-client'

interface CandidateData {
  id: string
  name: string
  track_id?: string
  wedge?: string
  distribution_type?: string
  support_level?: string
  timebox_days?: number
  competitors?: Array<{ name: string; price: string; gap: string }>
  voc_quotes?: Array<{ quote: string; source: string; pain_tag?: string }>
  mvp_in?: string[]
}

function CompareColumn({ candidate, label }: { candidate: CandidateData | null; label: string }) {
  if (!candidate) {
    return (
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <p className="text-zinc-500 text-center">Candidate not found</p>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="mb-4">
        <span className="text-xs px-2 py-0.5 bg-violet-900/50 text-violet-300 rounded-full">{label}</span>
      </div>
      <h3 className="text-xl font-semibold text-zinc-100 mb-2">{candidate.name}</h3>
      <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{candidate.track_id}</span>

      {/* Why this wins */}
      {candidate.wedge && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Why this wins</h4>
          <p className="text-sm text-zinc-300">{candidate.wedge}</p>
        </div>
      )}

      {/* Channel & Support */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs text-zinc-500 mb-1">Channel</h4>
          <p className="text-sm text-zinc-300">
            {distributionTypeLabels[candidate.distribution_type || ''] || candidate.distribution_type || 'N/A'}
          </p>
        </div>
        <div>
          <h4 className="text-xs text-zinc-500 mb-1">Support Level</h4>
          <p className="text-sm text-zinc-300">
            {supportLevelLabels[candidate.support_level || ''] || candidate.support_level || 'N/A'}
          </p>
        </div>
        <div>
          <h4 className="text-xs text-zinc-500 mb-1">Timeline</h4>
          <p className="text-sm text-zinc-300">{candidate.timebox_days || 14} days</p>
        </div>
      </div>

      {/* Competitors (top 2) */}
      {candidate.competitors && candidate.competitors.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Competitors</h4>
          <div className="space-y-2">
            {candidate.competitors.slice(0, 2).map((comp, i) => (
              <div key={i} className="text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-300 font-medium">{comp.name}</span>
                  <span className="text-zinc-500">{comp.price}</span>
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">{comp.gap}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VoC Quote (top 1) */}
      {candidate.voc_quotes && candidate.voc_quotes.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Real user quote</h4>
          <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
            <p className="text-sm text-zinc-300 italic">&ldquo;{candidate.voc_quotes[0].quote}&rdquo;</p>
            <p className="text-xs text-zinc-500 mt-1">— {candidate.voc_quotes[0].source}</p>
          </div>
        </div>
      )}

      {/* First steps (top 2) */}
      {candidate.mvp_in && candidate.mvp_in.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">First steps</h4>
          <ul className="space-y-1">
            {candidate.mvp_in.slice(0, 2).map((step, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-violet-400">•</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function CompareClient() {
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState<(CandidateData | null)[]>([null, null])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Ensure session ID exists
    getOrCreateSessionId()

    const ids = searchParams.get('ids')?.split(',') || []
    const loadedCandidates = ids.slice(0, 2).map((id) => getIdeaById(id) as CandidateData | undefined || null)
    setCandidates(loadedCandidates)
    setIsLoaded(true)

    // Track compare view
    if (ids.length > 0) {
      trackEvent('compare_viewed', { ids: ids.join(',') })
    }
  }, [searchParams])

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
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              IF
            </div>
            <span className="text-xl font-semibold text-zinc-100">IdeaFit</span>
          </Link>
          <Link href="/results" className="text-sm text-zinc-400 hover:text-zinc-300">
            ← Back to Results
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Compare Your Top Matches</h1>
          <p className="text-zinc-400">Side-by-side comparison to help you decide</p>
        </div>

        {candidates[0] || candidates[1] ? (
          <div className="flex flex-col md:flex-row gap-6">
            <CompareColumn candidate={candidates[0]} label="#1 Top Match" />
            <CompareColumn candidate={candidates[1]} label="#2 Runner-up" />
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <p>No candidates specified. Return to results and click &ldquo;Compare top 2&rdquo;.</p>
            <Link href="/results" className="text-violet-400 hover:text-violet-300 mt-4 inline-block">
              Go to Results →
            </Link>
          </div>
        )}

        {/* Decision helper */}
        {candidates[0] && candidates[1] && (
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Still not sure?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-medium text-zinc-300 mb-2">Choose {candidates[0].name} if...</h4>
                <ul className="space-y-1 text-zinc-400">
                  <li>• You want something you can build in {candidates[0].timebox_days || 14} days</li>
                  <li>• You prefer {distributionTypeLabels[candidates[0].distribution_type || ''] || 'this'} distribution</li>
                  <li>• {supportLevelLabels[candidates[0].support_level || ''] || 'The support level'} works for you</li>
                </ul>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-medium text-zinc-300 mb-2">Choose {candidates[1].name} if...</h4>
                <ul className="space-y-1 text-zinc-400">
                  <li>• You want something you can build in {candidates[1].timebox_days || 14} days</li>
                  <li>• You prefer {distributionTypeLabels[candidates[1].distribution_type || ''] || 'this'} distribution</li>
                  <li>• {supportLevelLabels[candidates[1].support_level || ''] || 'The support level'} works for you</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
