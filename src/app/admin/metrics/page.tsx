import { redirect } from 'next/navigation'
import { checkAdminToken } from '@/lib/admin-auth'
import { getEventCounts, getConversionRates, getEvents, getUniqueSessions, getUtmBreakdown, EventName } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

const EVENT_LABELS: Record<EventName, string> = {
  view_home: 'Home Views',
  start_quiz: 'Quiz Started',
  complete_quiz: 'Quiz Done',
  view_results: 'Results Viewed',
  click_save_results: 'Save Clicked',
  email_submitted: 'Emails',
  preview_viewed: 'Previews',
  sample_report_clicked: 'Sample Clicks',
  compare_viewed: 'Compares',
  share_x_clicked: 'X Shares',
  click_creator_site: 'Creator Site Clicks',
  click_creator_x: 'Creator X Clicks',
  click_creator_newsletter: 'Newsletter Clicks',
}

export default async function MetricsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; period?: string }>
}) {
  const params = await searchParams

  if (!checkAdminToken({ token: params.token })) {
    redirect('/')
  }

  const tokenParam = params.token ? `?token=${params.token}` : ''

  // Default to 7d if no period specified
  const period = params.period || '7d'

  // Calculate time range
  let since: Date | undefined
  let periodLabel = 'Last 7 days'
  let rangeForExport = '7d'

  if (period === '24h') {
    since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    periodLabel = 'Last 24 hours'
    rangeForExport = '24h'
  } else if (period === '7d') {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    periodLabel = 'Last 7 days'
    rangeForExport = '7d'
  } else if (period === '30d') {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    periodLabel = 'Last 30 days'
    rangeForExport = '30d'
  } else if (period === 'all') {
    since = undefined
    periodLabel = 'All time'
    rangeForExport = 'all'
  }

  const [counts, rates, recentEvents, uniqueSessions, utmBreakdown] = await Promise.all([
    getEventCounts(since),
    getConversionRates(since),
    getEvents({ since, limit: 50 }),
    getUniqueSessions(since),
    getUtmBreakdown(since),
  ])

  // Sort UTM sources by count
  const topSources = Object.entries(utmBreakdown.bySource)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  const topCampaigns = Object.entries(utmBreakdown.byCampaign)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const hasData = rates.totalEvents > 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Funnel Metrics</h1>
            <p className="text-zinc-400">{periodLabel} · {rates.totalEvents.toLocaleString()} events</p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/admin/library${tokenParam}`}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
            >
              Library
            </a>
            <a
              href={`/api/admin/metrics/export${tokenParam}&range=${rangeForExport}`}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium"
            >
              Export CSV
            </a>
          </div>
        </header>

        {/* Period selector */}
        <div className="flex gap-2 mb-8">
          <a
            href={`/admin/metrics${tokenParam}&period=24h`}
            className={`px-4 py-2 rounded-lg text-sm ${period === '24h' ? 'bg-violet-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            24h
          </a>
          <a
            href={`/admin/metrics${tokenParam}&period=7d`}
            className={`px-4 py-2 rounded-lg text-sm ${period === '7d' ? 'bg-violet-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            7 days
          </a>
          <a
            href={`/admin/metrics${tokenParam}&period=30d`}
            className={`px-4 py-2 rounded-lg text-sm ${period === '30d' ? 'bg-violet-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            30 days
          </a>
          <a
            href={`/admin/metrics${tokenParam}&period=all`}
            className={`px-4 py-2 rounded-lg text-sm ${period === 'all' ? 'bg-violet-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            All time
          </a>
        </div>

        {!hasData ? (
          /* Empty state */
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">No events yet</h2>
            <p className="text-zinc-400 mb-4 max-w-md mx-auto">
              Analytics events will appear here once users start interacting with IdeaMatch.
              Events are captured on page views, quiz interactions, and email submissions.
            </p>
            <div className="text-sm text-zinc-500">
              Test with: <code className="bg-zinc-800 px-2 py-1 rounded">curl -X POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/events -H &quot;Content-Type: application/json&quot; -d &apos;{'{'}&#34;event&#34;:&#34;view_home&#34;,&#34;sessionId&#34;:&#34;test&#34;{'}'}&apos;</code>
            </div>
          </div>
        ) : (
          <>
            {/* Top-level summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-violet-400">{uniqueSessions.toLocaleString()}</div>
                <div className="text-sm text-zinc-500">Unique Sessions</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold">{rates.totalEvents.toLocaleString()}</div>
                <div className="text-sm text-zinc-500">Total Events</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-emerald-400">{counts.email_submitted || 0}</div>
                <div className="text-sm text-zinc-500">Emails Collected</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className={`text-3xl font-bold ${(rates.resultsToEmail || 0) >= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {rates.resultsToEmail || 0}%
                </div>
                <div className="text-sm text-zinc-500">Results → Email</div>
              </div>
            </div>

            {/* Event counts */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
              {(Object.keys(EVENT_LABELS) as EventName[]).map((event) => (
                <div key={event} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <div className="text-xl font-bold">{counts[event] || 0}</div>
                  <div className="text-xs text-zinc-500">{EVENT_LABELS[event]}</div>
                </div>
              ))}
            </div>

            {/* Main content grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Conversion funnel */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>

                <div className="space-y-4">
                  <FunnelStep
                    label="Home → Quiz Start"
                    rate={rates.homeToQuiz}
                    from={counts.view_home || 0}
                    to={counts.start_quiz || 0}
                  />
                  <FunnelStep
                    label="Quiz Start → Complete"
                    rate={rates.quizStartToComplete}
                    from={counts.start_quiz || 0}
                    to={counts.complete_quiz || 0}
                  />
                  <FunnelStep
                    label="Complete → Results"
                    rate={rates.completeToResults}
                    from={counts.complete_quiz || 0}
                    to={counts.view_results || 0}
                  />
                  <FunnelStep
                    label="Results → Email"
                    rate={rates.resultsToEmail}
                    from={counts.view_results || 0}
                    to={counts.email_submitted || 0}
                  />
                </div>
              </div>

              {/* Attribution */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Traffic Sources</h2>

                {topSources.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    No UTM sources tracked yet. Add <code className="bg-zinc-800 px-1 rounded">?utm_source=X</code> to links.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topSources.map(([source, count]) => (
                      <div key={source} className="flex justify-between items-center">
                        <span className="text-sm font-mono">
                          {source === '(direct)' ? (
                            <span className="text-zinc-500">{source}</span>
                          ) : (
                            <span className="text-emerald-400">{source}</span>
                          )}
                        </span>
                        <span className="text-sm text-zinc-400">{count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {topCampaigns.filter(([c]) => c !== '(none)').length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-zinc-400 mt-6 mb-2">Top Campaigns</h3>
                    <div className="space-y-1">
                      {topCampaigns
                        .filter(([c]) => c !== '(none)')
                        .map(([campaign, count]) => (
                          <div key={campaign} className="flex justify-between items-center text-sm">
                            <span className="font-mono text-violet-400">{campaign}</span>
                            <span className="text-zinc-400">{count.toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent events */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500 border-b border-zinc-800">
                      <th className="pb-2 pr-4">Time</th>
                      <th className="pb-2 pr-4">Event</th>
                      <th className="pb-2 pr-4">Session</th>
                      <th className="pb-2 pr-4">Source</th>
                      <th className="pb-2 pr-4">Build</th>
                      <th className="pb-2">Properties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.map((event) => (
                      <tr key={event.id} className="border-b border-zinc-800/50">
                        <td className="py-2 pr-4 text-zinc-400">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">{event.event}</span>
                        </td>
                        <td className="py-2 pr-4 text-zinc-500 font-mono text-xs">{event.sessionId.slice(0, 12)}...</td>
                        <td className="py-2 pr-4 text-zinc-500 font-mono text-xs">
                          {event.utmSource || <span className="text-zinc-600">direct</span>}
                        </td>
                        <td className="py-2 pr-4 text-zinc-500 font-mono text-xs">{event.build}</td>
                        <td className="py-2 text-zinc-500 text-xs">
                          {event.properties ? JSON.stringify(event.properties) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Footer info */}
        <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-500">
          Events are persisted to Postgres with dedup (1/event/session/min) and rate limiting (30/session/min).
          UTM params captured from landing URLs. Check <a href={`/debug/db`} className="text-violet-400 hover:underline">/debug/db</a> for DB status.
        </div>
      </div>
    </div>
  )
}

function FunnelStep({ label, rate, from, to }: { label: string; rate: number | null; from: number; to: number }) {
  const rateColor = rate === null ? 'text-zinc-500' : rate >= 50 ? 'text-emerald-400' : rate >= 25 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span className="text-zinc-500">{from} → {to}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500"
            style={{ width: `${rate || 0}%` }}
          />
        </div>
      </div>
      <div className={`text-xl font-bold w-16 text-right ${rateColor}`}>
        {rate !== null ? `${rate}%` : '-'}
      </div>
    </div>
  )
}
