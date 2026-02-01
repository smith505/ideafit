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
          Go From &ldquo;Too Many Ideas&rdquo;
          <br />
          <span className="bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">to Building in 7 Minutes</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Take a quick quiz about your time, skills, and goals. Get a personalized report
          with exactly what to build, how to build it, and where to find your first customers.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            Find My Path →
          </Link>
          <SampleReportTracker
            href="/sample-report-v1.pdf"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-4 py-3 transition-colors border border-gray-300 rounded-full hover:border-gray-400 hover:bg-gray-50"
          >
            See a Sample Report
          </SampleReportTracker>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Quiz is free • Full report $9 • 5 regenerations included
        </p>
      </section>

      {/* What You Get */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          What&apos;s In Your Report
        </h2>
        <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
          Everything you need to go from &ldquo;I want to build something&rdquo; to actually shipping it.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">5 Personalized Ideas</h3>
            <p className="text-gray-600 text-sm">
              AI-generated ideas matched to your exact time, skills, and goals. Not random suggestions.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Competitor Breakdown</h3>
            <p className="text-gray-600 text-sm">
              Who&apos;s already doing this, what they charge, and exactly where they&apos;re weak.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">MVP Scope</h3>
            <p className="text-gray-600 text-sm">
              5-7 features to build first. Plus what to explicitly skip so you don&apos;t over-engineer.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Day-by-Day Ship Plan</h3>
            <p className="text-gray-600 text-sm">
              Exactly what to do each day to go from idea to launched. No guessing.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Monetization Strategy</h3>
            <p className="text-gray-600 text-sm">
              How to price it and a specific plan for finding your first 10 paying customers.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">5 Regenerations</h3>
            <p className="text-gray-600 text-sm">
              Don&apos;t love your ideas? Regenerate for completely fresh AI-generated matches.
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
            { step: '2', title: 'Get Matched', desc: 'AI generates personalized ideas based on your profile' },
            { step: '3', title: 'Preview & Unlock', desc: 'See your top match free, then unlock full report for $9' },
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
            Full report unlock starts at $9 after your free quiz
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
              'Common pain points',
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

          {/* AI-powered badge */}
          <p className="text-sm text-gray-500 mt-6">
            <svg className="w-4 h-4 inline-block mr-1 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI-powered: Every report is uniquely generated for your profile.
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
              How is each report unique?
            </h3>
            <p className="text-gray-600 text-sm">
              Every report is AI-generated specifically for your profile. No two reports are the same.
              Plus, you get 5 regenerations to explore completely different ideas and directions if you want variety.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">
              What are regenerations?
            </h3>
            <p className="text-gray-600 text-sm">
              If you don&apos;t love your matched ideas, you can regenerate your report up to 5 times to get
              fresh AI-generated ideas. Same quiz answers, completely new recommendations.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I see a sample before I pay?
            </h3>
            <p className="text-gray-600 text-sm">
              Yes! The quiz is completely free. After completing it, you&apos;ll see a preview with your #1 match
              and why it fits you. You only pay $9 if you want the full report with all 5 ideas, competitor analysis,
              MVP scope, and your personalized ship plan.
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
