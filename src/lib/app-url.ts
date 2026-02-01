/**
 * Canonical App URL helper
 * Single source of truth for the app's public URL
 */

type UrlSource = 'NEXT_PUBLIC_APP_URL' | 'VERCEL_URL' | 'RAILWAY_PUBLIC_DOMAIN' | 'localhost'

interface AppUrlResult {
  url: string
  source: UrlSource
}

/**
 * Get the canonical public URL for the app
 * Used for Stripe redirects, magic links, emails, etc.
 */
export function getPublicAppUrl(): string {
  return getPublicAppUrlWithSource().url
}

/**
 * Get the canonical public URL with its source (for debugging)
 */
export function getPublicAppUrlWithSource(): AppUrlResult {
  // Priority 1: Explicit configuration
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return {
      url: ensureHttps(process.env.NEXT_PUBLIC_APP_URL),
      source: 'NEXT_PUBLIC_APP_URL',
    }
  }

  // Priority 2: Vercel auto-detected URL
  if (process.env.VERCEL_URL) {
    return {
      url: `https://${process.env.VERCEL_URL}`,
      source: 'VERCEL_URL',
    }
  }

  // Priority 3: Railway auto-detected URL
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return {
      url: `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`,
      source: 'RAILWAY_PUBLIC_DOMAIN',
    }
  }

  // Fallback: localhost for development
  return {
    url: 'http://localhost:3000',
    source: 'localhost',
  }
}

/**
 * Ensure URL uses HTTPS in production
 */
function ensureHttps(url: string): string {
  // In production, always use HTTPS
  if (process.env.NODE_ENV === 'production') {
    return url.replace(/^http:\/\//, 'https://')
  }
  return url
}

/**
 * Check if the app URL is production-ready
 */
export function isProductionUrl(): boolean {
  const { url, source } = getPublicAppUrlWithSource()
  return (
    source !== 'localhost' &&
    url.startsWith('https://') &&
    !url.includes('localhost')
  )
}
