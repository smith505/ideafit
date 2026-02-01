// Centralized build info and response headers
// Single source of truth for all route handlers

export const BUILD_SHA = (
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  'dev'
).slice(0, 7)

export const BUILD_TIMESTAMP = new Date().toISOString()

export const COMMIT_ENV = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'not-set'

export const NODE_ENV = process.env.NODE_ENV || 'unknown'

/**
 * Returns standard cache-control and build headers for API responses
 * Use these in every route handler for consistent caching behavior
 */
export function getBuildHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, must-revalidate',
    'x-ideamatch-build': BUILD_SHA,
    'x-ideamatch-timestamp': new Date().toISOString(),
  }
}

/**
 * Helper to add build headers to an existing NextResponse
 * For route handlers that need to set additional headers
 */
export function addBuildHeaders(headers: Headers): void {
  const buildHeaders = getBuildHeaders()
  for (const [key, value] of Object.entries(buildHeaders)) {
    headers.set(key, value)
  }
}
