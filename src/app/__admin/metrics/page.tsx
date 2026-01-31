import { redirect } from 'next/navigation'
import { checkAdminToken } from '@/lib/admin-auth'
import { getEventCounts, getConversionRates, getEvents, EventName } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

const EVENT_LABELS: Record<EventName, string> = {
  view_home: 'Home Page Views',
  start_quiz: 'Quiz Started',
  complete_quiz: 'Quiz Completed',
  view_results: 'Results Viewed',
  click_save_results: 'Save Results Clicked',
  email_submitted: 'Email Submitted',
  preview_viewed: 'Preview Viewed',
  sample_report_clicked: 'Sample Report Clicked',
  compare_viewed: 'Compare Mode Viewed',
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

  // Calculate time range
  let since: Date | undefined
  let periodLabel = 'All time (since deploy)'

  if (params.period === '24h') {
    since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    periodLabel = 'Last 24 hours'
  } else if (params.period === '7d') {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    periodLabel = 'Last 7 days'
  }

  const counts = getEventCounts(since)
  const rates = getConversionRates(since)
  const recentEvents = getEvents({ since, limit: 50 })

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Funnel Metrics</h1>
          <p className="text-zinc-400">Track user flow through the quiz funnel</p>
        </header>

        {/* Period selector */}
        <div className="flex gap-2 mb-8">
          <a
            href={`/__admin/metrics${tokenParam}`}
            className={`px-4 py-2 rounded-lg text-sm ${!params.period ? 'bg-violet-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            All Time
          </a>
          <a
            href={`/__admin/metrics${tokenParam}&period=24h`}
            className={`px-4 py-2 rounded-lg text-sm ${params.period === '24h' ? 'bg-violet-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            Last 24h
          </a>
          <a
            href={`/__admin/metrics${tokenParam}&period=7d`}
            className={`px-4 py-2 rounded-lg text-sm ${params.period === '7d' ? 'bg-violet-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            Last 7 days
          </a>
        </div>

        {/* Event counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(Object.keys(EVENT_LABELS) as EventName[]).map((event) => (
            <div key={event} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold">{counts[event] || 0}</div>
              <div className="text-sm text-zinc-500">{EVENT_LABELS[event]}</div>
            </div>
          ))}
        </div>

        {/* Conversion funnel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>
          <p className="text-sm text-zinc-500 mb-4">{periodLabel} &middot; {rates.totalEvents} total events</p>

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
              label="Complete → Results View"
              rate={rates.completeToResults}
              from={counts.complete_quiz || 0}
              to={counts.view_results || 0}
            />
            <FunnelStep
              label="Results → Email Submit"
              rate={rates.resultsToEmail}
              from={counts.view_results || 0}
              to={counts.email_submitted || 0}
            />
          </div>
        </div>

        {/* Recent events */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
          {recentEvents.length === 0 ? (
            <p className="text-zinc-500 text-sm">No events recorded yet. Events are stored in memory and reset on deploy.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2 pr-4">Session</th>
                    <th className="pb-2 pr-4">Build</th>
                    <th className="pb-2">Properties</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      <td className="py-2 pr-4 text-zinc-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">{event.event}</span>
                      </td>
                      <td className="py-2 pr-4 text-zinc-500 font-mono text-xs">{event.sessionId.slice(0, 12)}...</td>
                      <td className="py-2 pr-4 text-zinc-500 font-mono text-xs">{event.build}</td>
                      <td className="py-2 text-zinc-500 text-xs">
                        {event.properties ? JSON.stringify(event.properties) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Note about persistence */}
        <div className="mt-8 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
          <p className="text-sm text-amber-200">
            <strong>Note:</strong> Events are stored in memory and will reset when the server restarts/deploys.
            For production, consider upgrading to persistent storage (database, Redis, or log aggregation).
          </p>
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
