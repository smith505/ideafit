import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Force dynamic to prevent any caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Build info captured at server startup
const BUILD_SHA = (process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7)
const BUILD_TIMESTAMP = new Date().toISOString()
const NODE_ENV = process.env.NODE_ENV || 'unknown'

export async function GET() {
  // Try to get Railway edge hint from incoming request
  const headersList = await headers()
  const railwayEdgeHint = headersList.get('x-railway-edge') || 'not-available'

  return NextResponse.json(
    {
      build: BUILD_SHA,
      timestamp: BUILD_TIMESTAMP,
      nodeEnv: NODE_ENV,
      railwayEdgeHint,
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'x-ideafit-build': BUILD_SHA,
        'x-ideafit-timestamp': BUILD_TIMESTAMP,
      },
    }
  )
}
