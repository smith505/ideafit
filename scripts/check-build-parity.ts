#!/usr/bin/env npx tsx
/**
 * Multi-endpoint build parity checker
 * Verifies all endpoints return the same build version
 * Run: BASE_URL=https://ideafit-production.up.railway.app npx tsx scripts/check-build-parity.ts
 */

const TARGET_URL = process.env.BASE_URL || 'http://localhost:3000'

interface EndpointResult {
  endpoint: string
  build: string | null
  source: 'header' | 'body'
  cacheControl: string | null
  error?: string
}

async function checkEndpoint(path: string, extractBuild: 'header' | 'body'): Promise<EndpointResult> {
  const url = `${TARGET_URL}${path}`

  try {
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })

    const buildHeader = response.headers.get('x-ideafit-build')
    const cacheControl = response.headers.get('cache-control')

    let build: string | null = null

    if (extractBuild === 'header') {
      build = buildHeader
    } else {
      const data = await response.json()
      build = data.build || null
    }

    return {
      endpoint: path,
      build,
      source: extractBuild,
      cacheControl,
    }
  } catch (error) {
    return {
      endpoint: path,
      build: null,
      source: extractBuild,
      cacheControl: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function main() {
  console.log(`\n🔍 Build Parity Check`)
  console.log(`Base URL: ${TARGET_URL}\n`)

  const results: EndpointResult[] = await Promise.all([
    checkEndpoint('/health', 'body'),
    checkEndpoint('/debug/build', 'body'),
    checkEndpoint('/', 'header'),
    checkEndpoint('/quiz', 'header'),
    checkEndpoint('/results', 'header'),
  ])

  // Print results
  console.log('Endpoint Results:')
  console.log('─'.repeat(80))

  for (const result of results) {
    const status = result.error ? '❌' : '✓'
    const buildDisplay = result.build || 'N/A'
    const cacheDisplay = result.cacheControl || 'N/A'
    const sourceDisplay = result.source === 'body' ? '(body)' : '(header)'

    console.log(
      `${status} ${result.endpoint.padEnd(20)} build: ${buildDisplay.padEnd(10)} ${sourceDisplay.padEnd(10)} cache: ${cacheDisplay}`
    )

    if (result.error) {
      console.log(`  Error: ${result.error}`)
    }
  }

  console.log('─'.repeat(80))

  // Check for errors
  const errors = results.filter((r) => r.error)
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} endpoint(s) failed to respond`)
    process.exit(1)
  }

  // Check build parity
  const builds = results.map((r) => r.build).filter(Boolean) as string[]
  const uniqueBuilds = [...new Set(builds)]

  if (uniqueBuilds.length === 0) {
    console.log('\n❌ No builds found in any endpoint')
    process.exit(1)
  }

  if (uniqueBuilds.length > 1) {
    console.log(`\n❌ BUILD MISMATCH DETECTED`)
    console.log(`Found ${uniqueBuilds.length} different builds: ${uniqueBuilds.join(', ')}`)
    process.exit(1)
  }

  // Check cache-control headers
  const missingCacheControl = results.filter((r) => !r.cacheControl?.includes('no-store'))
  if (missingCacheControl.length > 0) {
    console.log(`\n⚠️  Warning: ${missingCacheControl.length} endpoint(s) missing no-store cache-control:`)
    missingCacheControl.forEach((r) => console.log(`   - ${r.endpoint}`))
  }

  console.log(`\n✅ All endpoints report build: ${uniqueBuilds[0]}`)
  console.log(`✅ Build parity confirmed across ${results.length} endpoints\n`)

  process.exit(0)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
