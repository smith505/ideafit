import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface MagicAuthPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function MagicAuthPage({ searchParams }: MagicAuthPageProps) {
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  // Find and validate magic link
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: { include: { reports: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
  })

  if (!magicLink) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-8">
            This magic link is invalid or has already been used.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Check if expired
  if (new Date() > magicLink.expiresAt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Expired</h1>
          <p className="text-gray-600 mb-8">
            This magic link has expired. Please request a new one.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl"
          >
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  })

  // Redirect to most recent report
  const report = magicLink.user.reports[0]
  if (report) {
    const destination = report.status === 'UNLOCKED'
      ? `/report/${report.id}`
      : `/preview/${report.id}`
    redirect(destination)
  }

  // No reports, redirect to quiz
  redirect('/quiz')
}
