import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getIdeaById, getTrackById } from '@/lib/fit-algorithm'
import CheckoutButton from './checkout-button'

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

        {/* Winner card - visible */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8">
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

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                style={{ width: `${winner.score}%` }}
              />
            </div>
            <span className="text-lg font-semibold text-violet-400">
              {winner.score}% match
            </span>
          </div>

          <p className="text-zinc-400 mb-6">{winner.reason}</p>

          {winnerIdea && (
            <div className="pt-6 border-t border-zinc-800">
              <p className="text-zinc-300">{winnerIdea.wedge}</p>
            </div>
          )}
        </div>

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
                Get complete validation data, MVP spec, competitor analysis,
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

            {/* Competitor section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Competitor Analysis
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
