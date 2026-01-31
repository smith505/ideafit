/**
 * Simple admin authentication via ADMIN_TOKEN env var
 * In dev mode: always allowed
 * In prod mode: requires ADMIN_TOKEN header match
 */

export function isAdminAuthorized(request?: Request): boolean {
  // Always allow in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // In production, require ADMIN_TOKEN
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) {
    // No token configured = admin disabled in prod
    return false
  }

  if (!request) {
    return false
  }

  // Check header or query param
  const headerToken = request.headers.get('x-admin-token')
  const url = new URL(request.url)
  const queryToken = url.searchParams.get('token')

  return headerToken === adminToken || queryToken === adminToken
}

/**
 * Server component helper - checks cookie or query param
 */
export function checkAdminToken(searchParams: { token?: string }): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) {
    return false
  }

  return searchParams.token === adminToken
}
