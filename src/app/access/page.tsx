import { Metadata } from 'next'
import AccessForm from './access-form'

// Force dynamic rendering to prevent edge caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Access Your Report | IdeaFit',
  description: 'Enter your email to receive a magic link and access your IdeaFit report.',
}

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
              IF
            </div>
            <span className="text-2xl font-semibold text-zinc-100">IdeaFit</span>
          </a>
        </div>

        <AccessForm />
      </div>
    </div>
  )
}
