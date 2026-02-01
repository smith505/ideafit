import { NextResponse } from 'next/server'
import { checkAdminToken } from '@/lib/admin-auth'
import { getPublicAppUrlWithSource, isProductionUrl } from '@/lib/app-url'
import { BUILD_SHA, BUILD_TIMESTAMP } from '@/lib/build-headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') ?? undefined

  if (!checkAdminToken({ token })) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url, source } = getPublicAppUrlWithSource()

  const response = NextResponse.json({
    appUrl: url,
    sourceEnvKey: source,
    isProductionReady: isProductionUrl(),
    build: BUILD_SHA,
    timestamp: BUILD_TIMESTAMP,
  })

  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('X-IdeaMatch-Build', BUILD_SHA)
  response.headers.set('X-IdeaMatch-Timestamp', BUILD_TIMESTAMP)

  return response
}
