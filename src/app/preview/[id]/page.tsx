import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getIdeaById, getTrackById, generateMatchChips, FitProfile } from '@/lib/fit-algorithm'
import CheckoutButton from './checkout-button'

// Force dynamic rendering to prevent edge caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params

  const report = await prisma.report.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!report) {
    notFound()
  }

  // If already unlocked, redirect to full report
  if (report.status === 'UNLOCKED') {
    redirect(`/report/${id}`)
  }

  const rankedIdeas = report.rankedIdeas as Array<{
    id: string
    name: string
    score: number
    reason: string
    track: string
  }>

  const winner = rankedIdeas[0]
  const winnerIdea = getIdeaById(winner.id)
  const track = getTrackById(winner.track)

  // Get first competitor and VoC quote for teaser
  const firstCompetitor = winnerIdea?.competitors?.[0]
  const firstVocQuote = winnerIdea?.voc_quotes?.[0]

  // Generate match chips from stored fit profile
  const fitProfile = report.fitProfile as FitProfile | null
  const matchChips = fitProfile ? generateMatchChips(fitProfile, winner.id) : []

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              IF
            </div>
            <span className="text-xl font-semibold text-zinc-100">IdeaFit</span>
          </Link>
          <span className="text-sm text-zinc-500">Report Preview</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
            Your IdeaFit Report
          </h1>
          <p className="text-zinc-400">
            Preview your personalized startup idea match below
          </p>
        </div>

        {/* Track badge */}
        {track && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="text-sm text-zinc-500">Your fit track:</span>
              <span className="text-sm font-medium text-violet-400">{track.name}</span>
            </div>
          </div>
        )}

        {/* Winner card - visible */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-violet-900/50 text-violet-400 text-sm font-medium">
              Your #1 Match
            </span>
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-sm">
              {winner.track}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-zinc-100 mb-3">
            {winner.name}
          </h2>

          {/* Enhanced Score Visual */}
          <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Fit Score</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-violet-400">{winner.score}%</span>
                {winner.score >= 80 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 text-xs font-medium">
                    Excellent
                  </span>
                )}
                {winner.score >= 60 && winner.score < 80 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-400 text-xs font-medium">
                    Good
                  </span>
                )}
              </div>
            </div>
            <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-500"
                style={{ width: `${winner.score}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-600">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <p className="text-zinc-400 mb-6">{winner.reason}</p>

          {/* Match chips - Why this matches you */}
          {matchChips.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-zinc-500 mb-2">Why this matches you</p>
              <div className="flex flex-wrap gap-2">
                {matchChips.filter(c => c.type === 'match').map((chip, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-900/40 text-violet-300 text-xs font-medium"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {chip.label}
                  </span>
                ))}
                {matchChips.filter(c => c.type === 'avoided').map((chip, i) => (
                  <span
                    key={`avoided-${i}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-300 text-xs font-medium"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Why this wins - visible teaser */}
          {winnerIdea && (
            <div className="pt-6 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Why this wins
              </h3>
              <p className="text-zinc-300">{winnerIdea.wedge}</p>
            </div>
          )}
        </div>

        {/* First Competitor - visible teaser */}
        {firstCompetitor && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-100">
                Competitor Snapshot
              </h3>
              <span className="text-xs text-zinc-500">1 of {winnerIdea?.competitors?.length || 3}+</span>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-zinc-100">{firstCompetitor.name}</span>
                <span className="text-sm text-violet-400">{firstCompetitor.price}</span>
              </div>
              <p className="text-sm text-zinc-500">
                Gap: {firstCompetitor.gap}
              </p>
            </div>
          </div>
        )}

        {/* First real user quote - visible teaser */}
        {firstVocQuote && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-100">
                Real user quote
              </h3>
              <span className="text-xs text-zinc-500">1 of {winnerIdea?.voc_quotes?.length || 3}+</span>
            </div>
            <blockquote className="border-l-2 border-violet-500 pl-4">
              <p className="text-zinc-300 italic mb-2">&ldquo;{firstVocQuote.quote}&rdquo;</p>
              <cite className="text-sm text-zinc-500">
                {firstVocQuote.pain_tag} - <span className="text-violet-400">{(firstVocQuote as { source?: string }).source || 'User feedback'}</span>
              </cite>
            </blockquote>
          </div>
        )}

        {/* Blurred sections */}
        <div className="space-y-6 relative">
          {/* Blur overlay with purchase CTA */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="bg-zinc-950/90 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="w-16 h-16 rounded-full bg-violet-900/50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-zinc-100 mb-3">
                Unlock Your Full Report
              </h3>
              <p className="text-zinc-400 mb-6">
                Get complete validation data, MVP spec, all competitors,
                and your personalized 14-day ship plan.
              </p>

              <div className="mb-6">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-zinc-100">$49</span>
                  <span className="text-zinc-500">one-time</span>
                </div>
              </div>

              <CheckoutButton reportId={id} email={report.user.email} />

              <div className="mt-4 text-sm text-zinc-500">
                5 regenerations · 30-day access · PDF export
              </div>

              <p className="mt-4 text-xs text-zinc-600">
                Quality guarantee: 3+ competitors, 3+ real user quotes, clear positioning - or we fix it / refund (7 days)
              </p>
            </div>
          </div>

          {/* Blurred content */}
          <div className="blur-md opacity-50 pointer-events-none select-none">
            {/* Other ideas */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Other Top Matches
              </h3>
              <div className="space-y-4">
                {rankedIdeas.slice(1, 4).map((idea, i) => (
                  <div key={idea.id} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold">
                      #{i + 2}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-zinc-100">{idea.name}</div>
                      <div className="text-sm text-zinc-500">{idea.score}% match</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* More competitors */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Full Competitor Analysis
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-zinc-800/50 rounded-xl">
                    <div className="h-4 bg-zinc-700 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-zinc-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>

            {/* MVP section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                MVP Specification
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-zinc-800 rounded w-full" />
                ))}
              </div>
            </div>

            {/* Ship plan section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                14-Day Ship Plan
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800" />
                    <div className="flex-1 h-4 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
