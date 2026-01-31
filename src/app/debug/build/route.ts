import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { BUILD_SHA, BUILD_TIMESTAMP, NODE_ENV, COMMIT_ENV, getBuildHeaders } from '@/lib/build-headers'

// Force dynamic to prevent any caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // Try to get Railway edge hint from incoming request
  const headersList = await headers()
  const edgeHint = headersList.get('x-railway-edge') ||
    headersList.get('x-forwarded-for') ||
    'not-available'

  return NextResponse.json(
    {
      build: BUILD_SHA,
      timestamp: BUILD_TIMESTAMP,
      nodeEnv: NODE_ENV,
      edgeHint,
      commitEnv: COMMIT_ENV,
      serverTime: new Date().toISOString(),
    },
    {
      headers: getBuildHeaders(),
    }
  )
}
