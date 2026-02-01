import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getIdeaById, getTrackById, generateMatchChips, FitProfile } from '@/lib/fit-algorithm'
import CheckoutButton from './checkout-button'
import { AnalyticsTracker } from '@/components/analytics-tracker'
import { CreatorFooter } from '@/components/creator-footer'

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <AnalyticsTracker event="preview_viewed" properties={{ reportId: id }} />
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              IM
            </div>
            <span className="text-xl font-semibold text-gray-900">IdeaMatch</span>
          </Link>
          <span className="text-sm text-gray-500">Report Preview</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your IdeaMatch Report
          </h1>
          <p className="text-gray-600">
            Preview your personalized startup idea match below
          </p>
        </div>

        {/* Track badge */}
        {track && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
              <span className="text-sm text-gray-500">Your fit track:</span>
              <span className="text-sm font-medium text-violet-600">{track.name}</span>
            </div>
          </div>
        )}

        {/* Winner card - visible */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
              Your #1 Match
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
              {winner.track}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {winner.name}
          </h2>

          {/* Enhanced Score Visual */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Fit Score</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-violet-600">{winner.score}%</span>
                {winner.score >= 80 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                    Excellent
                  </span>
                )}
                {winner.score >= 60 && winner.score < 80 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    Good
                  </span>
                )}
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-orange-500 transition-all duration-500"
                style={{ width: `${winner.score}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{winner.reason}</p>

          {/* Match chips - Why this matches you */}
          {matchChips.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">Why this matches you</p>
              <div className="flex flex-wrap gap-2">
                {matchChips.filter(c => c.type === 'match').map((chip, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"
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
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Why this wins
              </h3>
              <p className="text-gray-700">{winnerIdea.wedge}</p>
            </div>
          )}
        </div>

        {/* First Competitor - visible teaser */}
        {firstCompetitor && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Competitor Snapshot
              </h3>
              <span className="text-xs text-gray-500">1 of {winnerIdea?.competitors?.length || 3}+</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{firstCompetitor.name}</span>
                <span className="text-sm text-violet-600">{firstCompetitor.price}</span>
              </div>
              <p className="text-sm text-gray-500">
                Gap: {firstCompetitor.gap}
              </p>
            </div>
          </div>
        )}

        {/* First pain point - visible teaser */}
        {firstVocQuote && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Common pain point
              </h3>
              <span className="text-xs text-gray-500">1 of 3+</span>
            </div>
            <blockquote className="border-l-2 border-violet-500 pl-4">
              <p className="text-gray-700 italic mb-2">&ldquo;{firstVocQuote.quote}&rdquo;</p>
              <cite className="text-sm text-gray-500">
                {firstVocQuote.pain_tag} - <span className="text-violet-600">{(firstVocQuote as { source?: string }).source || 'User feedback'}</span>
              </cite>
            </blockquote>
          </div>
        )}

        {/* Blurred sections */}
        <div className="space-y-6 relative">
          {/* Blur overlay with purchase CTA */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 max-w-lg mx-4 shadow-xl">
              <div className="text-center mb-6">
                <div className="inline-flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900">$5</span>
                  <span className="text-gray-500">one-time</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Stop researching. Start building.
                </h3>
              </div>

              {/* Value list */}
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-900">5 personalized ideas</span>
                    <span className="text-gray-500 text-sm"> — matched to your time, skills, and goals</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-900">Competitor breakdown</span>
                    <span className="text-gray-500 text-sm"> — who&apos;s out there, what they charge, and their weakness</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-900">MVP scope</span>
                    <span className="text-gray-500 text-sm"> — exactly what to build (and what to skip) for v1</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-900">Day-by-day ship plan</span>
                    <span className="text-gray-500 text-sm"> — go from idea to launched in {winner.track?.includes('Extension') ? '7' : '14'} days</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-900">Monetization + first users</span>
                    <span className="text-gray-500 text-sm"> — how to price it and where to find customers</span>
                  </div>
                </div>
              </div>

              <CheckoutButton reportId={id} email={report.user.email} />

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Instant access
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF export
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI-powered
                </span>
              </div>
            </div>
          </div>

          {/* Blurred content */}
          <div className="blur-md opacity-50 pointer-events-none select-none">
            {/* Other ideas */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Other Top Matches
              </h3>
              <div className="space-y-4">
                {rankedIdeas.slice(1, 4).map((idea, i) => (
                  <div key={idea.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      #{i + 2}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{idea.name}</div>
                      <div className="text-sm text-gray-500">{idea.score}% match</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* More competitors */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Full Competitor Analysis
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>

            {/* MVP section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                MVP Specification
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded w-full" />
                ))}
              </div>
            </div>

            {/* Ship plan section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                14-Day Ship Plan
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100" />
                    <div className="flex-1 h-4 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center">
          <CreatorFooter />
        </footer>
      </main>
    </div>
  )
}
