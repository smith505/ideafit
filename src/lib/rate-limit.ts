/**
 * Simple in-memory rate limiting
 * For magic link and other abuse-prone endpoints
 */

import crypto from 'crypto'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (resets on deploy, which is fine for this use case)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Every minute

/**
 * Hash an email for privacy-preserving rate limiting
 */
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 16)
}

/**
 * Get IP from request headers (handles proxies)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Check rate limit for magic link requests
 * Returns { allowed: boolean, retryAfter?: number }
 */
export function checkMagicLinkRateLimit(
  ip: string,
  email: string
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()

  // Rate limit by IP (broader protection)
  const ipKey = `ip:${ip}`
  const ipEntry = rateLimitStore.get(ipKey)

  if (ipEntry) {
    if (ipEntry.resetAt > now) {
      if (ipEntry.count >= 10) {
        // 10 requests per 10 minutes per IP
        return { allowed: false, retryAfter: Math.ceil((ipEntry.resetAt - now) / 1000) }
      }
    } else {
      // Reset window
      rateLimitStore.delete(ipKey)
    }
  }

  // Rate limit by email hash (per-email protection)
  const emailHash = hashEmail(email)
  const emailKey = `email:${emailHash}`
  const emailEntry = rateLimitStore.get(emailKey)

  if (emailEntry) {
    if (emailEntry.resetAt > now) {
      if (emailEntry.count >= 5) {
        // 5 requests per 10 minutes per email
        return { allowed: false, retryAfter: Math.ceil((emailEntry.resetAt - now) / 1000) }
      }
    } else {
      // Reset window
      rateLimitStore.delete(emailKey)
    }
  }

  // Increment counters
  const windowMs = 10 * 60 * 1000 // 10 minutes
  const newResetAt = now + windowMs

  const currentIp = rateLimitStore.get(ipKey)
  const ipStillValid = currentIp && currentIp.resetAt > now
  rateLimitStore.set(ipKey, {
    count: ipStillValid ? currentIp.count + 1 : 1,
    resetAt: ipStillValid ? currentIp.resetAt : newResetAt,
  })

  const currentEmail = rateLimitStore.get(emailKey)
  const emailStillValid = currentEmail && currentEmail.resetAt > now
  rateLimitStore.set(emailKey, {
    count: emailStillValid ? currentEmail.count + 1 : 1,
    resetAt: emailStillValid ? currentEmail.resetAt : newResetAt,
  })

  return { allowed: true }
}
