import { Suspense } from 'react'
import CompareClient from './compare-client'

export const dynamic = 'force-dynamic'

function CompareSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <CompareClient />
    </Suspense>
  )
}
