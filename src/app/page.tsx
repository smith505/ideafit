import library from "../../data/library.json";
import Link from "next/link";

type Candidate = (typeof library.candidates)[number];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-zinc-700 text-zinc-300",
    ready_v1: "bg-emerald-900 text-emerald-300",
    testing: "bg-amber-900 text-amber-300",
    archived: "bg-red-900 text-red-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

function IdeaCard({ candidate }: { candidate: Candidate }) {
  return (
    <Link
      href={`/idea/${candidate.id}`}
      className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-lg text-zinc-100">{candidate.name}</h3>
        <StatusBadge status={candidate.status} />
      </div>

      {candidate.audience && (
        <p className="text-xs text-violet-400 mb-2">{candidate.audience}</p>
      )}

      {candidate.description && (
        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{candidate.description}</p>
      )}

      {candidate.wedge && (
        <p className="text-sm text-zinc-500 mb-3 line-clamp-2">
          <span className="text-zinc-600">Wedge:</span> {candidate.wedge}
        </p>
      )}

      {candidate.pricing_range && (
        <p className="text-sm text-emerald-400 mb-3">{candidate.pricing_range}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {candidate.competitors.length} competitors
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {candidate.voc_quotes.length} VoC
        </span>
        {candidate.timebox_minutes && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {candidate.timebox_minutes}m
          </span>
        )}
      </div>
    </Link>
  );
}

export default function Home() {
  const tracks = library.tracks;
  const candidates = library.candidates;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              IF
            </div>
            <h1 className="text-xl font-semibold">IdeaFit</h1>
          </div>
          <div className="text-sm text-zinc-500">
            {candidates.length} ideas · {tracks.length} tracks
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-zinc-100">{candidates.length}</div>
            <div className="text-sm text-zinc-500">Total Ideas</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-400">
              {candidates.filter(c => c.status === 'ready_v1').length}
            </div>
            <div className="text-sm text-zinc-500">Ready</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">
              {candidates.filter(c => c.status === 'draft').length}
            </div>
            <div className="text-sm text-zinc-500">Drafts</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-zinc-100">{tracks.length}</div>
            <div className="text-sm text-zinc-500">Tracks</div>
          </div>
        </div>

        {/* Ideas by Track */}
        {tracks.map((track) => {
          const trackCandidates = candidates.filter(c => c.track_id === track.name);
          return (
            <section key={track.id} className="mb-10">
              <h2 className="text-lg font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                {track.name}
                <span className="text-sm font-normal text-zinc-600">({trackCandidates.length})</span>
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trackCandidates.map((candidate) => (
                  <IdeaCard key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Untracked Ideas */}
        {(() => {
          const untracked = candidates.filter(c => !c.track_id);
          if (untracked.length === 0) return null;
          return (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                Untracked
                <span className="text-sm font-normal text-zinc-600">({untracked.length})</span>
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {untracked.map((candidate) => (
                  <IdeaCard key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </section>
          );
        })()}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-zinc-600">
          Last updated: {new Date(library.generated_at).toLocaleDateString()}
        </div>
      </footer>
    </div>
  );
}
