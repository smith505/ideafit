import { Metadata } from 'next'
import AccessForm from './access-form'

// Force dynamic rendering to prevent edge caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Access Your Report | IdeaMatch',
  description: 'Enter your email to receive a magic link and access your IdeaMatch report.',
}

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
              IM
            </div>
            <span className="text-2xl font-semibold text-gray-900">IdeaMatch</span>
          </a>
        </div>

        <AccessForm />
      </div>
    </div>
  )
}
