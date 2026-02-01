/**
 * Launch Readiness Verification Script
 * Checks all critical endpoints and configuration before going live
 *
 * Usage:
 *   npm run verify:launch                    # Check localhost:3000
 *   npm run verify:launch:prod               # Check production URL
 *   BASE_URL=https://example.com npx tsx scripts/verify-launch.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  data?: Record<string, unknown>
}

const results: CheckResult[] = []

function log(result: CheckResult) {
  results.push(result)
  const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗'
  console.log(`${icon} ${result.name}: ${result.message}`)
  if (result.data) {
    console.log(`    ${JSON.stringify(result.data)}`)
  }
}

async function fetchJson(path: string, requireToken = false): Promise<{ ok: boolean; status: number; data?: Record<string, unknown>; error?: string }> {
  try {
    const url = new URL(path, BASE_URL)
    if (requireToken && ADMIN_TOKEN) {
      url.searchParams.set('token', ADMIN_TOKEN)
    }
    const res = await fetch(url.toString(), {
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` }
    }
    const data = await res.json()
    return { ok: true, status: res.status, data }
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function checkHealth() {
  const result = await fetchJson('/health')
  if (result.ok && result.data) {
    log({
      name: 'Health Endpoint',
      status: 'pass',
      message: `Build ${result.data.build}, ${result.data.candidateCount} candidates`,
      data: { build: result.data.build, quizQuestionCount: result.data.quizQuestionCount },
    })
  } else {
    log({ name: 'Health Endpoint', status: 'fail', message: result.error || 'Failed' })
  }
}

async function checkBuild() {
  const result = await fetchJson('/debug/build')
  if (result.ok && result.data) {
    log({
      name: 'Build Info',
      status: 'pass',
      message: `Build ${result.data.build}`,
      data: { timestamp: result.data.timestamp },
    })
  } else {
    log({ name: 'Build Info', status: 'fail', message: result.error || 'Failed' })
  }
}

async function checkAppUrl() {
  const result = await fetchJson('/debug/app-url', true)
  if (!result.ok) {
    log({ name: 'App URL', status: 'fail', message: result.error || 'Failed (need ADMIN_TOKEN?)' })
    return
  }

  const data = result.data!
  const appUrl = data.appUrl as string
  const isProduction = data.isProductionReady as boolean

  if (!appUrl.startsWith('https://') && BASE_URL.startsWith('https://')) {
    log({
      name: 'App URL',
      status: 'fail',
      message: `App URL should be HTTPS in production`,
      data: { appUrl, source: data.sourceEnvKey },
    })
  } else if (appUrl.includes('localhost') && !BASE_URL.includes('localhost')) {
    log({
      name: 'App URL',
      status: 'fail',
      message: `App URL is localhost but checking production`,
      data: { appUrl, source: data.sourceEnvKey },
    })
  } else if (isProduction) {
    log({
      name: 'App URL',
      status: 'pass',
      message: `Production ready: ${appUrl}`,
      data: { source: data.sourceEnvKey },
    })
  } else {
    log({
      name: 'App URL',
      status: 'warn',
      message: `Not production ready: ${appUrl}`,
      data: { source: data.sourceEnvKey },
    })
  }
}

async function checkStripe() {
  const result = await fetchJson('/debug/stripe', true)
  if (!result.ok) {
    log({ name: 'Stripe Config', status: 'fail', message: result.error || 'Failed (need ADMIN_TOKEN?)' })
    return
  }

  const data = result.data!
  const mode = data.mode as string
  const webhookConfigured = data.webhookConfigured as boolean
  const secretKeyConfigured = data.secretKeyConfigured as boolean

  // Check mode alignment
  const isProductionUrl = !BASE_URL.includes('localhost')
  if (isProductionUrl && mode === 'test') {
    log({
      name: 'Stripe Mode',
      status: 'warn',
      message: 'Running in TEST mode on production URL',
      data: { mode, webhookConfigured },
    })
  } else if (!isProductionUrl && mode === 'live') {
    log({
      name: 'Stripe Mode',
      status: 'warn',
      message: 'Running in LIVE mode on non-production URL',
      data: { mode },
    })
  } else {
    log({
      name: 'Stripe Mode',
      status: 'pass',
      message: `Mode: ${mode}`,
      data: { mode },
    })
  }

  if (!webhookConfigured) {
    log({
      name: 'Stripe Webhook',
      status: 'fail',
      message: 'Webhook secret not configured',
    })
  } else {
    log({
      name: 'Stripe Webhook',
      status: 'pass',
      message: 'Webhook secret configured',
    })
  }

  if (!secretKeyConfigured) {
    log({
      name: 'Stripe Secret Key',
      status: 'fail',
      message: 'Secret key not configured',
    })
  } else {
    log({
      name: 'Stripe Secret Key',
      status: 'pass',
      message: 'Secret key configured',
    })
  }
}

async function checkEmail() {
  const result = await fetchJson('/debug/email', true)
  if (!result.ok) {
    log({ name: 'Email Config', status: 'fail', message: result.error || 'Failed (need ADMIN_TOKEN?)' })
    return
  }

  const data = result.data!
  const resendConfigured = data.resendConfigured as boolean
  const fromAddress = data.fromAddress as string
  const validationIssues = data.validationIssues as string[]

  if (!resendConfigured) {
    log({
      name: 'Resend API',
      status: 'fail',
      message: 'RESEND_API_KEY not configured',
    })
  } else {
    log({
      name: 'Resend API',
      status: 'pass',
      message: 'Resend configured',
    })
  }

  if (fromAddress.includes('example.com') || fromAddress.includes('localhost')) {
    log({
      name: 'Email From Address',
      status: 'fail',
      message: `Invalid from address: ${fromAddress}`,
    })
  } else {
    log({
      name: 'Email From Address',
      status: 'pass',
      message: fromAddress,
    })
  }

  if (validationIssues.length > 0) {
    log({
      name: 'Email Validation',
      status: 'warn',
      message: validationIssues.join(', '),
    })
  }
}

async function checkDb() {
  const result = await fetchJson('/debug/db')
  if (result.ok && result.data) {
    const dbStatus = result.data.db as string
    if (dbStatus === 'ok') {
      log({
        name: 'Database',
        status: 'pass',
        message: `Connected, ${result.data.eventCountLast24h} events in last 24h`,
      })
    } else {
      log({
        name: 'Database',
        status: 'fail',
        message: `Database error`,
        data: result.data,
      })
    }
  } else {
    log({ name: 'Database', status: 'fail', message: result.error || 'Failed' })
  }
}

async function main() {
  console.log('\n========================================')
  console.log('IdeaMatch Launch Readiness Check')
  console.log(`Target: ${BASE_URL}`)
  console.log(`Admin Token: ${ADMIN_TOKEN ? 'provided' : 'not provided (some checks will fail)'}`)
  console.log('========================================\n')

  await checkHealth()
  await checkBuild()
  await checkDb()
  await checkAppUrl()
  await checkStripe()
  await checkEmail()

  console.log('\n========================================')
  console.log('Summary')
  console.log('========================================')

  const passed = results.filter(r => r.status === 'pass').length
  const warned = results.filter(r => r.status === 'warn').length
  const failed = results.filter(r => r.status === 'fail').length

  console.log(`✓ Passed: ${passed}`)
  console.log(`⚠ Warnings: ${warned}`)
  console.log(`✗ Failed: ${failed}`)

  if (failed > 0) {
    console.log('\n❌ NOT READY FOR LAUNCH')
    console.log('Fix the failed checks above before going live.')
    process.exit(1)
  } else if (warned > 0) {
    console.log('\n⚠️  READY WITH WARNINGS')
    console.log('Review warnings above. May be acceptable for soft launch.')
    process.exit(0)
  } else {
    console.log('\n✅ READY FOR LAUNCH')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Verification failed:', error)
  process.exit(1)
})
