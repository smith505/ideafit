import { NextResponse } from 'next/server'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { exportEventsAsCsv } from '@/lib/analytics'
import { getBuildHeaders } from '@/lib/build-headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const headers = getBuildHeaders()

  // Check admin auth
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
  }

  const { searchParams } = new URL(request.url)

  // Parse time range
  const range = searchParams.get('range') || 'all'
  let since: Date | undefined

  if (range === '24h') {
    since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  } else if (range === '7d') {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  } else if (range === '30d') {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }

  try {
    const csv = await exportEventsAsCsv(since)

    const filename = `ideamatch-events-${range}-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export events' },
      { status: 500, headers }
    )
  }
}
