import { NextResponse } from 'next/server'
import { getBuildHeaders, BUILD_SHA } from '@/lib/build-headers'
import { checkDatabaseHealth, getAnalyticsStats } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const headers = getBuildHeaders()
  const timestamp = new Date().toISOString()

  try {
    // Check database connectivity
    const healthResult = await checkDatabaseHealth()

    if (!healthResult.ok) {
      return NextResponse.json(
        {
          build: BUILD_SHA,
          db: 'error',
          error: healthResult.error,
          eventCountLast24h: -1,
          latestEventAt: null,
          timestamp,
        },
        { status: 200, headers } // Return 200 so monitoring doesn't alert on expected errors
      )
    }

    // Get analytics stats
    const stats = await getAnalyticsStats()

    return NextResponse.json(
      {
        build: BUILD_SHA,
        db: 'ok',
        eventCountLast24h: stats.eventCountLast24h,
        latestEventAt: stats.latestEventAt,
        timestamp,
      },
      { headers }
    )
  } catch (error) {
    // Catch-all for unexpected errors
    const safeError = error instanceof Error
      ? error.message.slice(0, 100).replace(/postgresql:\/\/[^@]+@/g, '***')
      : 'unknown'

    return NextResponse.json(
      {
        build: BUILD_SHA,
        db: 'error',
        error: safeError,
        eventCountLast24h: -1,
        latestEventAt: null,
        timestamp,
      },
      { status: 200, headers }
    )
  }
}
