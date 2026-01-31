import library from "../../../../data/library.json";
import Link from "next/link";
import { notFound } from "next/navigation";

type Candidate = (typeof library.candidates)[number];

export function generateStaticParams() {
  return library.candidates.map((candidate) => ({
    id: candidate.id,
  }));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </section>
  );
}

function ArrayBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-zinc-200 flex items-start gap-2">
          <span className="text-violet-400 mt-1">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CompetitorCard({ competitor, index }: { competitor: Candidate["competitors"][number]; index: number }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-zinc-200">{competitor.name || `Competitor ${index + 1}`}</h4>
        {competitor.price && (
          <span className="text-sm text-emerald-400 font-medium">{competitor.price}</span>
        )}
      </div>
      {competitor.gap && (
        <p className="text-sm text-zinc-400">
          <span className="text-amber-400">Gap:</span> {competitor.gap}
        </p>
      )}
    </div>
  );
}

function VoCCard({ quote }: { quote: Candidate["voc_quotes"][number] }) {
  const source = (quote as { source?: string }).source;
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
      {quote.quote && (
        <p className="text-zinc-200 italic mb-3">&ldquo;{quote.quote}&rdquo;</p>
      )}
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 bg-violet-900/50 text-violet-300 rounded text-xs font-medium">
          {quote.pain_tag}
        </span>
        {source && (
          <span className="text-xs text-zinc-500">
            {source}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = library.candidates.find((c) => c.id === id);

  if (!candidate) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    draft: "bg-zinc-700 text-zinc-300",
    ready_v1: "bg-emerald-900 text-emerald-300",
    testing: "bg-amber-900 text-amber-300",
    archived: "bg-red-900 text-red-300",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">{candidate.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {candidate.track_id && (
                  <span className="text-zinc-500">{candidate.track_id}</span>
                )}
                {candidate.audience && (
                  <span className="text-violet-400 text-sm">• {candidate.audience}</span>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[candidate.status] || statusColors.draft}`}>
              {candidate.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Description & Wedge */}
        {(candidate.description || candidate.wedge) && (
          <Section title="Overview">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              {candidate.description && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-1">Description</h3>
                  <p className="text-zinc-200">{candidate.description}</p>
                </div>
              )}
              {candidate.wedge && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-1">Wedge</h3>
                  <p className="text-zinc-200">{candidate.wedge}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* MVP */}
        {(candidate.mvp_in.length > 0 || candidate.mvp_out.length > 0) && (
          <Section title="MVP Scope">
            <div className="grid md:grid-cols-2 gap-4">
              {candidate.mvp_in.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm text-zinc-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    In Scope (MVP)
                  </h3>
                  <ArrayBulletList items={candidate.mvp_in} />
                </div>
              )}
              {candidate.mvp_out.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm text-zinc-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Out of Scope
                  </h3>
                  <ArrayBulletList items={candidate.mvp_out} />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Distribution & Support */}
        {(candidate.distribution_type || candidate.support_level) && (
          <Section title="Distribution Strategy">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-6">
                {candidate.distribution_type && (
                  <div>
                    <span className="text-sm text-zinc-500">Distribution Type</span>
                    <p className="text-zinc-200 font-medium capitalize">{candidate.distribution_type}</p>
                  </div>
                )}
                {candidate.support_level && (
                  <div>
                    <span className="text-sm text-zinc-500">Support Level</span>
                    <p className="text-zinc-200 font-medium capitalize">{candidate.support_level}</p>
                  </div>
                )}
                {candidate.timebox_days && (
                  <div>
                    <span className="text-sm text-zinc-500">Timebox</span>
                    <p className="text-emerald-400 font-semibold">{candidate.timebox_days} days</p>
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Keywords & Tags */}
        {(candidate.keywords.length > 0 || candidate.interest_tags.length > 0 || candidate.avoid_tags.length > 0) && (
          <Section title="Tags & Keywords">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              {candidate.keywords.length > 0 && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {candidate.interest_tags.length > 0 && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-2">Interest Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.interest_tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-violet-900/40 text-violet-300 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {candidate.avoid_tags.length > 0 && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-2">Avoid Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.avoid_tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Competitors */}
        {candidate.competitors.length > 0 && (
          <Section title={`Competitors (${candidate.competitors.length})`}>
            <div className="grid gap-4">
              {candidate.competitors.map((comp, i) => (
                <CompetitorCard key={i} competitor={comp} index={i} />
              ))}
            </div>
          </Section>
        )}

        {/* VoC Quotes */}
        {candidate.voc_quotes.length > 0 && (
          <Section title={`Voice of Customer (${candidate.voc_quotes.length})`}>
            <div className="grid gap-4">
              {candidate.voc_quotes.map((quote, i) => (
                <VoCCard key={i} quote={quote} />
              ))}
            </div>
          </Section>
        )}

        {/* Metadata */}
        <Section title="Metadata">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">ID</span>
              <p className="text-zinc-300 font-mono text-xs">{candidate.id}</p>
            </div>
            <div>
              <span className="text-zinc-500">Status</span>
              <p className="text-zinc-300">{candidate.status}</p>
            </div>
            <div>
              <span className="text-zinc-500">Timebox</span>
              <p className="text-zinc-300">{candidate.timebox_days} days</p>
            </div>
            <div>
              <span className="text-zinc-500">Track</span>
              <p className="text-zinc-300">{candidate.track_id || 'None'}</p>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
