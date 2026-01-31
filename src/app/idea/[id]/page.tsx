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

function CompetitorCard({ competitor, index }: { competitor: Candidate["competitors"][number]; index: number }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-zinc-200">{competitor.name || `Competitor ${index + 1}`}</h4>
        {competitor.price && (
          <span className="text-sm text-zinc-400">{competitor.price}</span>
        )}
      </div>
      {competitor.url && (
        <a
          href={competitor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-violet-400 hover:text-violet-300 break-all"
        >
          {competitor.url}
        </a>
      )}
      {competitor.gap && (
        <p className="mt-2 text-sm text-zinc-400">
          <span className="text-zinc-500">Gap:</span> {competitor.gap}
        </p>
      )}
    </div>
  );
}

function VoCCard({ quote, index }: { quote: Candidate["voc_quotes"][number]; index: number }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-2">
        <span className="px-2 py-0.5 bg-violet-900/50 text-violet-300 rounded text-xs font-medium">
          {quote.pain_tag}
        </span>
      </div>
      {quote.quote && (
        <p className="text-zinc-300 italic mb-2">&ldquo;{quote.quote}&rdquo;</p>
      )}
      {quote.url && (
        <a
          href={quote.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-400 break-all"
        >
          {quote.url}
        </a>
      )}
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
              {candidate.track_id && (
                <p className="text-zinc-500 mt-1">{candidate.track_id}</p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[candidate.status] || statusColors.draft}`}>
              {candidate.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Overview */}
        {(candidate.wedge || candidate.assumptions) && (
          <Section title="Overview">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              {candidate.wedge && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-1">Wedge</h3>
                  <p className="text-zinc-200">{candidate.wedge}</p>
                </div>
              )}
              {candidate.assumptions && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-1">Key Assumptions</h3>
                  <p className="text-zinc-200">{candidate.assumptions}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* MVP */}
        {(candidate.mvp_in || candidate.mvp_out) && (
          <Section title="MVP Definition">
            <div className="grid md:grid-cols-2 gap-4">
              {candidate.mvp_in && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm text-zinc-500 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Input
                  </h3>
                  <p className="text-zinc-200">{candidate.mvp_in}</p>
                </div>
              )}
              {candidate.mvp_out && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm text-zinc-500 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Output
                  </h3>
                  <p className="text-zinc-200">{candidate.mvp_out}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* First 10 Users */}
        {(candidate.first10_channel || candidate.first10_steps) && (
          <Section title="First 10 Users">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              {candidate.first10_channel && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-1">Channel</h3>
                  <p className="text-zinc-200">{candidate.first10_channel}</p>
                </div>
              )}
              {candidate.first10_steps && (
                <div>
                  <h3 className="text-sm text-zinc-500 mb-1">Steps</h3>
                  <p className="text-zinc-200 whitespace-pre-line">{candidate.first10_steps}</p>
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
                <VoCCard key={i} quote={quote} index={i} />
              ))}
            </div>
          </Section>
        )}

        {/* Risk Checklist */}
        <Section title="Risk Assessment">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${candidate.risk_checklist.market_risk ? 'bg-amber-500' : 'bg-zinc-700'}`}></span>
                <span className="text-sm text-zinc-400">Market Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${candidate.risk_checklist.tech_risk ? 'bg-amber-500' : 'bg-zinc-700'}`}></span>
                <span className="text-sm text-zinc-400">Tech Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${candidate.risk_checklist.regulatory_risk ? 'bg-amber-500' : 'bg-zinc-700'}`}></span>
                <span className="text-sm text-zinc-400">Regulatory</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${candidate.risk_checklist.competition_risk ? 'bg-amber-500' : 'bg-zinc-700'}`}></span>
                <span className="text-sm text-zinc-400">Competition</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Metadata */}
        <Section title="Metadata">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">ID</span>
              <p className="text-zinc-300 font-mono">{candidate.id}</p>
            </div>
            <div>
              <span className="text-zinc-500">Keywords Checked</span>
              <p className="text-zinc-300">{candidate.keywords_checked ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
