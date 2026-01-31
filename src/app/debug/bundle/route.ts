import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { BUILD_SHA, BUILD_TIMESTAMP, NODE_ENV, COMMIT_ENV, getBuildHeaders } from '@/lib/build-headers'

// Force dynamic to prevent any caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SelfCheckResult {
  endpoint: string
  build: string | null
  source: 'header' | 'body'
  error?: string
}

async function selfCheck(baseUrl: string): Promise<SelfCheckResult[]> {
  const results: SelfCheckResult[] = []

  // Check /health (build in body)
  try {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'Cache-Control': 'no-cache' },
    })
    const data = await res.json()
    results.push({
      endpoint: '/health',
      build: data.build || null,
      source: 'body',
    })
  } catch (error) {
    results.push({
      endpoint: '/health',
      build: null,
      source: 'body',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Check /debug/build (build in body)
  try {
    const res = await fetch(`${baseUrl}/debug/build`, {
      headers: { 'Cache-Control': 'no-cache' },
    })
    const data = await res.json()
    results.push({
      endpoint: '/debug/build',
      build: data.build || null,
      source: 'body',
    })
  } catch (error) {
    results.push({
      endpoint: '/debug/build',
      build: null,
      source: 'body',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Check pages via header
  for (const path of ['/', '/quiz', '/results']) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      const build = res.headers.get('x-ideafit-build')
      results.push({
        endpoint: path,
        build,
        source: 'header',
      })
    } catch (error) {
      results.push({
        endpoint: path,
        build: null,
        source: 'header',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

export async function GET(request: Request) {
  const headersList = await headers()
  const edgeHint = headersList.get('x-railway-edge') ||
    headersList.get('x-forwarded-for') ||
    'not-available'

  // Determine base URL
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    `${requestUrl.protocol}//${requestUrl.host}`

  // Run self-check
  const selfCheckResults = await selfCheck(baseUrl)

  // Build text output
  const lines: string[] = [
    `build=${BUILD_SHA}`,
    `timestamp=${BUILD_TIMESTAMP}`,
    `nodeEnv=${NODE_ENV}`,
    `edgeHint=${edgeHint}`,
    `commitEnv=${COMMIT_ENV}`,
    `serverTime=${new Date().toISOString()}`,
    '',
    'selfcheck:',
  ]

  // Check for mismatches
  const builds = selfCheckResults.map(r => r.build).filter(Boolean)
  const uniqueBuilds = [...new Set(builds)]
  const hasMismatch = uniqueBuilds.length > 1

  for (const result of selfCheckResults) {
    const mismatch = result.build && result.build !== BUILD_SHA ? ' [MISMATCH]' : ''
    const error = result.error ? ` [ERROR: ${result.error}]` : ''
    lines.push(`  ${result.endpoint} (${result.source}) -> ${result.build || 'N/A'}${mismatch}${error}`)
  }

  if (hasMismatch) {
    lines.push('')
    lines.push(`⚠️ MISMATCH DETECTED: Found builds: ${uniqueBuilds.join(', ')}`)
  } else if (uniqueBuilds.length === 1) {
    lines.push('')
    lines.push(`✓ All endpoints report build: ${uniqueBuilds[0]}`)
  }

  const body = lines.join('\n')

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...getBuildHeaders(),
    },
  })
}
