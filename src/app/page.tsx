import { Metadata } from 'next'
import Link from 'next/link'
import { BuildVersion } from '@/components/build-version'
import { AnalyticsTracker, SampleReportTracker } from '@/components/analytics-tracker'
import { CreatorFooter } from '@/components/creator-footer'

// Force dynamic rendering to prevent edge caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'IdeaMatch | Find Your Best Startup Idea in 7 Minutes',
  description:
    'Stop second-guessing. Take the Quick Fit Quiz and get a personalized report with your top idea, validation data, and a 14-day ship plan.',
  openGraph: {
    title: 'IdeaMatch | Find Your Best Startup Idea in 7 Minutes',
    description:
      'Take the Quick Fit Quiz and get a personalized report with your top idea, validation data, and a 14-day ship plan.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <AnalyticsTracker event="view_home" />
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              IM
            </div>
            <span className="text-xl font-semibold text-gray-900">IdeaMatch</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/access"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              I have a report
            </Link>
            <Link
              href="/quiz"
              className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              Take the Quiz
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Find Your Best Startup Idea
          <br />
          <span className="bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">in 7 Minutes</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Stop second-guessing. Take the Quick Fit Quiz and get matched to validated
          startup ideas that fit your time, skills, and goals.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            Take the Free Quiz →
          </Link>
          <SampleReportTracker
            href="/sample-report-v1.pdf"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-4 py-3 transition-colors border border-gray-300 rounded-full hover:border-gray-400 hover:bg-gray-50"
          >
            View Sample Report
          </SampleReportTracker>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Quiz is free • Full report $49 • 7-day quality guarantee
        </p>
        <p className="text-xs text-gray-500 mt-2">
          ✓ 3+ competitors researched • ✓ 3+ real user quotes • ✓ Clear positioning — or full refund
        </p>
      </section>

      {/* What You Get */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">
          What You&apos;ll Get
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fit Profile</h3>
            <p className="text-gray-600 text-sm">
              Understand your ideal idea type based on time, skills, and goals.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Winner Idea + Validation</h3>
            <p className="text-gray-600 text-sm">
              Your top-matched idea with competitors, real user quotes, and market signals.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">14-Day Ship Plan</h3>
            <p className="text-gray-600 text-sm">
              Day-by-day tasks with acceptance criteria. Plus Claude prompts for your stack.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Take Quiz', desc: '~7 min quiz about your time, skills, and goals' },
            { step: '2', title: 'Get Matched', desc: 'AI matches you to ideas from our validated library' },
            { step: '3', title: 'Preview & Unlock', desc: 'See your top match free, then unlock full report for $49' },
            { step: '4', title: 'Start Building', desc: 'Follow the 14-day plan with Claude prompts' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 text-white font-bold flex items-center justify-center mx-auto mb-4 shadow-md">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-200">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Full report unlock starts at $49 after your free quiz
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Take the quiz free, preview your top match, then decide if you want the full report.
          </p>

          {/* What's included */}
          <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto mb-8 text-left">
            {[
              'Complete Fit Profile analysis',
              'Top 5 matched ideas with scores',
              'Competitor & pricing research',
              'Real user quotes',
              'Full MVP specification',
              '14-day ship plan + Claude prompts',
              '5 regenerations included',
              'PDF export & 30-day access',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>

          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            Take Free Quiz (see preview)
          </Link>

          {/* Quality guarantee */}
          <p className="text-sm text-gray-500 mt-6">
            <svg className="w-4 h-4 inline-block mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Quality guarantee: 3 competitors + 3 real user quotes + clear positioning, or we fix it / refund (7 days).
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">
              What kind of ideas are in the library?
            </h3>
            <p className="text-gray-600 text-sm">
              Our library includes validated micro-SaaS, browser extensions, Chrome tools, and utility products.
              Each idea has been researched with real competitor analysis and voice-of-customer quotes from Reddit,
              Twitter, and forums.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">
              How does the matching work?
            </h3>
            <p className="text-gray-600 text-sm">
              We score each idea based on your quiz answers: time availability, technical skills, support tolerance,
              revenue goals, and audience access. You get matched to ideas that fit your specific constraints and strengths.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">
              What if the report isn&apos;t useful?
            </h3>
            <p className="text-gray-600 text-sm">
              Every report includes at least 3 competitor analyses, 3 real user quotes, and clear positioning
              (why this idea wins). If your report doesn&apos;t meet these standards, email us within 7 days
              and we&apos;ll either fix it or give you a full refund.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">
              What are regenerations?
            </h3>
            <p className="text-gray-600 text-sm">
              If you don&apos;t love your matched idea, you can regenerate your report up to 5 times to explore
              different matches from our library. Same quiz answers, different top picks.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I see a sample before I pay?
            </h3>
            <p className="text-gray-600 text-sm">
              Yes! The quiz is completely free. After completing it, you&apos;ll see a preview with your #1 match,
              why it wins, one competitor, and one real user quote. You only pay $49 if you want the full report with
              all 5 matches, complete validation data, and the 14-day ship plan.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/about" className="hover:text-gray-900 transition-colors">About</Link>
            <span className="text-gray-300">·</span>
            <Link href="/build-log" className="hover:text-gray-900 transition-colors">Build Log</Link>
          </div>
          <CreatorFooter />
          <span className="text-sm text-gray-500">
            © 2026 IdeaMatch. Find your fit. Ship your idea.
          </span>
          <BuildVersion />
        </div>
      </footer>
    </div>
  )
}
