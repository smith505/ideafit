import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FitProfile } from '@/lib/fit-algorithm'
import { AIIdea } from '@/lib/ai-ideas'
import ExportButton from './export-button'

interface ReportPageProps {
  params: Promise<{ id: string }>
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params

  const report = await prisma.report.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!report) {
    notFound()
  }

  // If not unlocked, redirect to preview
  if (report.status !== 'UNLOCKED') {
    redirect(`/preview/${id}`)
  }

  // Use AI-generated ideas if available
  const aiIdeas = (report.aiIdeas as unknown as AIIdea[]) || []
  const rankedIdeas = report.rankedIdeas as Array<{
    id: string
    name: string
    score: number
    reason: string
    track: string
  }>

  const fitProfile = report.fitProfile as unknown as FitProfile
  const winner = rankedIdeas[0]
  const winnerIdea = aiIdeas[0] // AI-generated full idea

  const createdDate = new Date(report.createdAt).toLocaleDateString()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              IM
            </div>
            <span className="text-xl font-semibold text-gray-900">IdeaMatch</span>
          </Link>
          <div className="flex items-center gap-4">
            <ExportButton reportId={id} />
            <span className="text-sm text-gray-500">{report.user.email}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Title section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
              Unlocked
            </span>
            <span className="text-sm text-gray-500">
              Generated {createdDate}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your IdeaMatch Report
          </h1>
          <p className="text-gray-600">
            Personalized startup idea recommendations based on your profile
          </p>
        </div>

        {/* Fit Profile */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            Your Fit Profile
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Weekly Hours', value: fitProfile.timeWeekly },
              { label: 'Tech Level', value: fitProfile.techComfort },
              { label: 'Support Tolerance', value: fitProfile.supportTolerance },
              { label: 'Revenue Goal', value: fitProfile.revenueGoal },
              { label: 'Build Style', value: fitProfile.buildPreference },
              { label: 'Risk Level', value: fitProfile.riskTolerance },
              { label: 'Audience Access', value: fitProfile.audienceAccess?.join(', ') || 'None' },
              { label: 'Skills', value: fitProfile.existingSkills?.join(', ') || 'None' },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                <div className="text-gray-900 font-medium capitalize">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Winner Idea */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </span>
            Your #1 Match
          </h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                Best Match
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                {winner.track}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">{winner.name}</h3>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-orange-500"
                  style={{ width: `${winner.score}%` }}
                />
              </div>
              <span className="text-lg font-semibold text-violet-600">{winner.score}% match</span>
            </div>

            <p className="text-gray-600 mb-6">{winner.reason}</p>

            {winnerIdea && (
              <>
                {winnerIdea.wedge && (
                  <div className="border-t border-gray-100 pt-6 mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Why this wins
                    </h4>
                    <p className="text-gray-700">{winnerIdea.wedge}</p>
                  </div>
                )}

                {winnerIdea.desc && (
                  <div className="border-t border-gray-100 pt-6 mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Description
                    </h4>
                    <p className="text-gray-700">{winnerIdea.desc}</p>
                  </div>
                )}

                {(winnerIdea.mvp?.length > 0 || winnerIdea.skip?.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                    {winnerIdea.mvp?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          MVP In Scope
                        </h4>
                        <ul className="text-gray-700 space-y-1">
                          {winnerIdea.mvp.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-500">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {winnerIdea.skip?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Skip for V1
                        </h4>
                        <ul className="text-gray-700 space-y-1">
                          {winnerIdea.skip.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Other Matches */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
            Other Top Matches
          </h2>

          <div className="space-y-4">
            {rankedIdeas.slice(1).map((idea, i) => {
              const aiIdea = aiIdeas[i + 1]
              return (
                <div key={idea.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold shrink-0">
                      #{i + 2}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {idea.track}
                        </span>
                        <span className="text-sm text-violet-600 font-medium">{idea.score}% match</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{idea.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{idea.reason}</p>
                      {aiIdea?.wedge && (
                        <p className="text-sm text-gray-500">{aiIdea.wedge}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Competitors */}
        {winnerIdea?.comps && winnerIdea.comps.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Competitor Analysis
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              {winnerIdea.comps.map((comp, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">{comp.n}</h4>
                  <div className="text-sm text-violet-600 mb-3">{comp.p}</div>
                  <p className="text-sm text-gray-600">{comp.g}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pain Points */}
        {winnerIdea?.pains && winnerIdea.pains.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              Common Pain Points
            </h2>

            <div className="space-y-4">
              {winnerIdea.pains.map((pain, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <blockquote className="text-gray-700 italic mb-3">
                    &ldquo;{pain.q}&rdquo;
                  </blockquote>
                  <span className="text-xs text-gray-500">
                    Source: {pain.s}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ship Plan */}
        {winnerIdea && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              Ship Plan
            </h2>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              {/* Summary stats */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <h4 className="text-sm text-gray-500 mb-2">Timeline</h4>
                  <p className="text-2xl font-bold text-emerald-600">
                    {winnerIdea.days || 14} days
                  </p>
                  <p className="text-xs text-gray-500 mt-1">to MVP</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <h4 className="text-sm text-gray-500 mb-2">Target Audience</h4>
                  <p className="text-lg font-semibold text-violet-600">
                    {winnerIdea.audience || 'General'}
                  </p>
                </div>
                {winnerIdea.monetization && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <h4 className="text-sm text-gray-500 mb-2">Monetization</h4>
                    <p className="text-lg font-semibold text-orange-500">
                      {winnerIdea.monetization}
                    </p>
                  </div>
                )}
              </div>

              {/* Day-by-day plan */}
              {winnerIdea.shipPlan && winnerIdea.shipPlan.length > 0 && (
                <div className="border-t border-gray-100 pt-6 mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Day-by-Day Plan
                  </h4>
                  <div className="space-y-3">
                    {winnerIdea.shipPlan.map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-20 shrink-0">
                          <span className="text-sm font-semibold text-violet-600">{step.day}</span>
                        </div>
                        <div className="flex-1 text-gray-700">{step.task}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* First users */}
              {winnerIdea.firstUsers && (
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Where to Find Your First 10 Users
                  </h4>
                  <p className="text-gray-700">{winnerIdea.firstUsers}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Take Quiz Again Section */}
        <section className="border-t border-gray-200 pt-12">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Want different ideas?
            </h3>
            <p className="text-gray-600 mb-6">
              Take the quiz again with different answers to get fresh AI-generated matches.
            </p>
            <Link
              href="/quiz"
              className="inline-flex px-6 py-3 rounded-xl font-semibold transition-all bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Take Quiz Again
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
