import { redirect } from 'next/navigation'
import { checkAdminToken } from '@/lib/admin-auth'
import library from '../../../../data/library.json'

export const dynamic = 'force-dynamic'

interface Candidate {
  id: string
  name: string
  status?: string
  track_id?: string
  audience_mode?: string
  delivery_mode?: string
  support_level?: string
  wedge?: string
  competitors?: Array<{ name: string; price: string; gap: string }>
  voc_quotes?: Array<{ quote: string; source: string }>
  mvp_in?: string[]
  mvp_out?: string[]
  interest_tags?: string[]
  avoid_tags?: string[]
}

interface QualityCheck {
  pass: boolean
  value: number
  required: number
  label: string
}

function getQualityChecks(c: Candidate): QualityCheck[] {
  return [
    { pass: (c.competitors?.length || 0) >= 3, value: c.competitors?.length || 0, required: 3, label: 'Competitors' },
    { pass: (c.voc_quotes?.length || 0) >= 3, value: c.voc_quotes?.length || 0, required: 3, label: 'VoC Quotes' },
    { pass: !!c.wedge && c.wedge.trim().length > 0, value: c.wedge ? 1 : 0, required: 1, label: 'Wedge' },
    { pass: (c.mvp_in?.length || 0) >= 7, value: c.mvp_in?.length || 0, required: 7, label: 'MVP In' },
    { pass: (c.mvp_out?.length || 0) >= 5, value: c.mvp_out?.length || 0, required: 5, label: 'MVP Out' },
    { pass: (c.interest_tags?.length || 0) > 0, value: c.interest_tags?.length || 0, required: 1, label: 'Interest Tags' },
    { pass: (c.avoid_tags?.length || 0) > 0, value: c.avoid_tags?.length || 0, required: 1, label: 'Avoid Tags' },
  ]
}

function isFullyQualified(c: Candidate): boolean {
  return getQualityChecks(c).every((check) => check.pass)
}

export default async function LibraryAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; filter?: string; search?: string; id?: string }>
}) {
  const params = await searchParams

  // Check admin auth
  if (!checkAdminToken({ token: params.token })) {
    redirect('/')
  }

  const candidates = library.candidates as Candidate[]
  const tokenParam = params.token ? `?token=${params.token}` : ''

  // Filter logic
  let filtered = candidates
  if (params.filter) {
    const [field, value] = params.filter.split(':')
    filtered = filtered.filter((c) => {
      const candidateValue = (c as unknown as Record<string, unknown>)[field]
      return candidateValue === value
    })
  }

  // Search logic
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(searchLower) ||
        c.name.toLowerCase().includes(searchLower)
    )
  }

  // Selected candidate detail
  const selectedCandidate = params.id
    ? candidates.find((c) => c.id === params.id)
    : null

  // Stats
  const qualifiedCount = candidates.filter(isFullyQualified).length
  const consumerCount = candidates.filter((c) => c.audience_mode === 'consumer').length
  const builderCount = candidates.filter((c) => c.audience_mode === 'builder').length
  const bothCount = candidates.filter((c) => c.audience_mode === 'both').length

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Library Studio</h1>
          <p className="text-zinc-400">Manage and scale the idea library</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{candidates.length}</div>
            <div className="text-sm text-zinc-500">Total Candidates</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-400">{qualifiedCount}</div>
            <div className="text-sm text-zinc-500">Fully Qualified</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{consumerCount}</div>
            <div className="text-sm text-zinc-500">Consumer</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-violet-400">{builderCount}</div>
            <div className="text-sm text-zinc-500">Builder</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{bothCount}</div>
            <div className="text-sm text-zinc-500">Both</div>
          </div>
        </div>

        {/* Target mix progress */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8">
          <h3 className="font-semibold mb-3">Target Mix (100 total)</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span>Consumer (target: 40)</span>
                <span className={consumerCount >= 40 ? 'text-emerald-400' : 'text-zinc-400'}>{consumerCount}/40</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (consumerCount / 40) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Builder (target: 50)</span>
                <span className={builderCount >= 50 ? 'text-emerald-400' : 'text-zinc-400'}>{builderCount}/50</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500" style={{ width: `${Math.min(100, (builderCount / 50) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Both (target: 10)</span>
                <span className={bothCount >= 10 ? 'text-emerald-400' : 'text-zinc-400'}>{bothCount}/10</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (bothCount / 10) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <form className="flex gap-2" action={`/__admin/library${tokenParam}`} method="get">
            {params.token && <input type="hidden" name="token" value={params.token} />}
            <input
              type="text"
              name="search"
              placeholder="Search by ID or name..."
              defaultValue={params.search}
              className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm w-64"
            />
            <button type="submit" className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">Search</button>
          </form>
          <div className="flex gap-2">
            <a href={`/__admin/library${tokenParam}`} className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">All</a>
            <a href={`/__admin/library${tokenParam}&filter=audience_mode:consumer`} className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">Consumer</a>
            <a href={`/__admin/library${tokenParam}&filter=audience_mode:builder`} className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">Builder</a>
            <a href={`/__admin/library${tokenParam}&filter=audience_mode:both`} className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">Both</a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate list */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-semibold text-zinc-400 text-sm">{filtered.length} candidates</h3>
            {filtered.map((c) => {
              const checks = getQualityChecks(c)
              const passCount = checks.filter((ch) => ch.pass).length
              const isSelected = selectedCandidate?.id === c.id

              return (
                <a
                  key={c.id}
                  href={`/__admin/library${tokenParam}&id=${c.id}`}
                  className={`block bg-zinc-900 border rounded-lg p-4 hover:border-zinc-600 transition-colors ${
                    isSelected ? 'border-violet-500' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${passCount === checks.length ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="font-medium truncate">{c.name}</span>
                      </div>
                      <div className="flex gap-2 text-xs text-zinc-500">
                        <span className="px-2 py-0.5 bg-zinc-800 rounded">{c.audience_mode}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 rounded">{c.track_id}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 rounded">{c.support_level}</span>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {passCount}/{checks.length}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1">
            {selectedCandidate ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sticky top-4">
                <h3 className="font-semibold mb-4">{selectedCandidate.name}</h3>
                <div className="text-xs text-zinc-500 mb-4">ID: {selectedCandidate.id}</div>

                <div className="space-y-4">
                  {/* Quality checklist */}
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">Quality Checklist</h4>
                    <div className="space-y-2">
                      {getQualityChecks(selectedCandidate).map((check, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className={check.pass ? 'text-zinc-300' : 'text-red-400'}>
                            {check.pass ? '✓' : '✗'} {check.label}
                          </span>
                          <span className="text-zinc-500">{check.value}/{check.required}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">Metadata</h4>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-zinc-500">Audience</dt>
                      <dd>{selectedCandidate.audience_mode}</dd>
                      <dt className="text-zinc-500">Track</dt>
                      <dd>{selectedCandidate.track_id}</dd>
                      <dt className="text-zinc-500">Support</dt>
                      <dd>{selectedCandidate.support_level}</dd>
                      <dt className="text-zinc-500">Delivery</dt>
                      <dd>{selectedCandidate.delivery_mode}</dd>
                    </dl>
                  </div>

                  {/* Wedge */}
                  {selectedCandidate.wedge && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-2">Wedge</h4>
                      <p className="text-sm text-zinc-300">{selectedCandidate.wedge}</p>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCandidate.interest_tags?.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-violet-900/50 text-violet-300 rounded text-xs">{tag}</span>
                      ))}
                      {selectedCandidate.avoid_tags?.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-red-900/50 text-red-300 rounded text-xs">!{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Competitors */}
                  {selectedCandidate.competitors && selectedCandidate.competitors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-2">Competitors ({selectedCandidate.competitors.length})</h4>
                      <ul className="space-y-1 text-sm">
                        {selectedCandidate.competitors.map((comp, i) => (
                          <li key={i} className="text-zinc-300">{comp.name} - {comp.price}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* VoC Quotes */}
                  {selectedCandidate.voc_quotes && selectedCandidate.voc_quotes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-2">VoC Quotes ({selectedCandidate.voc_quotes.length})</h4>
                      <ul className="space-y-2 text-sm">
                        {selectedCandidate.voc_quotes.map((quote, i) => (
                          <li key={i} className="text-zinc-300 italic">&ldquo;{quote.quote.slice(0, 60)}...&rdquo; <span className="text-zinc-500">- {quote.source}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
                Select a candidate to view details
              </div>
            )}
          </div>
        </div>

        {/* Export buttons */}
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <h3 className="font-semibold mb-4">Export Tools</h3>
          <div className="flex gap-4">
            <a
              href="/api/admin/library/export"
              className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
            >
              Export library.json
            </a>
            <a
              href="/api/admin/library/csv-template"
              className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
            >
              Download CSV Template
            </a>
          </div>
          <p className="text-sm text-zinc-500 mt-4">
            To import: <code className="bg-zinc-800 px-2 py-0.5 rounded">npx tsx scripts/library/import-csv.ts path/to/file.csv</code>
          </p>
        </div>
      </div>
    </div>
  )
}
