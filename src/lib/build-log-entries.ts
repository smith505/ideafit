// Build log entries - add new entries at the top
export interface BuildLogEntry {
  date: string // YYYY-MM-DD
  title: string
  bullets: string[]
}

export const BUILD_LOG_ENTRIES: BuildLogEntry[] = [
  {
    date: '2026-01-31',
    title: 'Personal brand loop + UX audit',
    bullets: [
      'Added "Built by Cory Smith" footer across all pages',
      'Created About and Build Log pages',
      'Added Share on X button with UTM tracking',
      'Improved low confidence guidance on results page',
      'Made preview page guarantee more prominent',
    ],
  },
  {
    date: '2026-01-30',
    title: 'Persistent analytics + Railway reliability',
    bullets: [
      'Migrated analytics from in-memory to Postgres',
      'Added auto-migrations during Railway build',
      'Created /debug/db health endpoint',
      'Added UTM parameter capture and CSV export',
      'Made analytics resilient to DB failures',
    ],
  },
  {
    date: '2026-01-29',
    title: 'Build verification tooling',
    bullets: [
      'Added x-ideafit-build header to all responses',
      'Created /debug/build and /health endpoints',
      'Implemented E2E test suite for production',
      'Added build parity checking script',
    ],
  },
  {
    date: '2026-01-28',
    title: 'Quiz + report flow MVP',
    bullets: [
      'Launched 14-question quiz with localStorage persistence',
      'Built fit algorithm matching users to ideas',
      'Created preview and full report pages',
      'Integrated Stripe Checkout for $49 unlock',
    ],
  },
]
