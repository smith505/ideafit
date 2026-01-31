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
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000) // 3s timeout

  const endpoints: Array<{ path: string; source: 'body' | 'header' }> = [
    { path: '/health', source: 'body' },
    { path: '/debug/build', source: 'body' },
    { path: '/', source: 'header' },
    { path: '/quiz', source: 'header' },
    { path: '/results', source: 'header' },
  ]

  try {
    for (const { path, source } of endpoints) {
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          headers: { 'Cache-Control': 'no-cache' },
          signal: controller.signal,
        })

        if (source === 'body') {
          const data = await res.json()
          results.push({ endpoint: path, build: data.build || null, source })
        } else {
          results.push({ endpoint: path, build: res.headers.get('x-ideafit-build'), source })
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error'
        // Simplify network errors that are expected on Railway
        const simplifiedError = errMsg.includes('fetch failed') || errMsg.includes('abort')
          ? 'network unreachable (expected on Railway)'
          : errMsg
        results.push({ endpoint: path, build: null, source, error: simplifiedError })
      }
    }
  } finally {
    clearTimeout(timeout)
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

  // Check if selfcheck completely failed (Railway can't reach itself)
  const allFailed = selfCheckResults.every(r => r.error)

  if (allFailed) {
    lines.push('')
    lines.push('Note: Selfcheck unavailable (Railway servers cannot reach themselves).')
    lines.push('Run `npm run build:parity:prod` externally to verify all endpoints.')
  } else if (hasMismatch) {
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
