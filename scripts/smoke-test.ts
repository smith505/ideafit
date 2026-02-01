/**
 * Smoke test script for IdeaMatch production deployment
 * Usage: npx tsx scripts/smoke-test.ts https://your-domain.com
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'

interface TestResult {
  url: string
  status: number
  ok: boolean
  contentType?: string
  error?: string
}

async function testEndpoint(path: string, expectedContentType?: string): Promise<TestResult> {
  const url = `${BASE_URL}${path}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'IdeaMatch-SmokeTest/1.0',
      },
    })

    const contentType = response.headers.get('content-type') || ''

    const result: TestResult = {
      url,
      status: response.status,
      ok: response.status === 200,
      contentType,
    }

    // Check content type if specified
    if (expectedContentType && !contentType.includes(expectedContentType)) {
      result.ok = false
      result.error = `Expected content-type ${expectedContentType}, got ${contentType}`
    }

    return result
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function runTests() {
  console.log(`\n🔍 Running smoke tests against: ${BASE_URL}\n`)

  const tests = [
    { path: '/', name: 'Landing page', contentType: 'text/html' },
    { path: '/sample-report-v1.pdf', name: 'Sample report PDF (versioned)', contentType: 'application/pdf' },
    { path: '/sample-report.pdf', name: 'Sample report PDF (legacy)', contentType: 'application/pdf' },
    { path: '/quiz', name: 'Quiz page', contentType: 'text/html' },
    { path: '/access', name: 'Access page', contentType: 'text/html' },
    { path: '/login', name: 'Login page', contentType: 'text/html' },
  ]

  const results: TestResult[] = []
  let allPassed = true

  for (const test of tests) {
    const result = await testEndpoint(test.path, test.contentType)
    results.push(result)

    const status = result.ok ? '✅' : '❌'
    console.log(`${status} ${test.name}`)
    console.log(`   ${result.url}`)
    console.log(`   Status: ${result.status}`)

    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }

    if (!result.ok) {
      allPassed = false
    }

    console.log('')
  }

  // Summary
  const passed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`)

  if (allPassed) {
    console.log('🎉 All smoke tests passed!\n')
    process.exit(0)
  } else {
    console.log('💥 Some smoke tests failed!\n')
    process.exit(1)
  }
}

runTests()
