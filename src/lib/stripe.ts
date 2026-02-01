/**
 * Stripe configuration with test/live mode support
 * Provides safety rails for switching between test and live modes
 */

import Stripe from 'stripe'

export const REPORT_PRICE_CENTS = 900 // $9.00

// Stripe mode type
export type StripeMode = 'test' | 'live'

/**
 * Get the current Stripe mode
 * Defaults to 'test' for safety
 */
export function getStripeMode(): StripeMode {
  const mode = process.env.STRIPE_MODE?.toLowerCase()
  if (mode === 'live') {
    return 'live'
  }
  return 'test'
}

/**
 * Get the appropriate Stripe secret key for the current mode
 */
function getStripeSecretKey(): string {
  const mode = getStripeMode()

  // Try mode-specific key first
  if (mode === 'live' && process.env.STRIPE_SECRET_KEY_LIVE) {
    return process.env.STRIPE_SECRET_KEY_LIVE
  }
  if (mode === 'test' && process.env.STRIPE_SECRET_KEY_TEST) {
    return process.env.STRIPE_SECRET_KEY_TEST
  }

  // Fall back to generic key (backwards compatible)
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY
  }

  throw new Error(
    `Missing Stripe secret key. Set STRIPE_SECRET_KEY_${mode.toUpperCase()} or STRIPE_SECRET_KEY`
  )
}

/**
 * Get the Stripe webhook secret for the current mode
 */
export function getStripeWebhookSecret(): string {
  const mode = getStripeMode()

  // Try mode-specific secret first
  if (mode === 'live' && process.env.STRIPE_WEBHOOK_SECRET_LIVE) {
    return process.env.STRIPE_WEBHOOK_SECRET_LIVE
  }
  if (mode === 'test' && process.env.STRIPE_WEBHOOK_SECRET_TEST) {
    return process.env.STRIPE_WEBHOOK_SECRET_TEST
  }

  // Fall back to generic secret (backwards compatible)
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    return process.env.STRIPE_WEBHOOK_SECRET
  }

  throw new Error(
    `Missing Stripe webhook secret. Set STRIPE_WEBHOOK_SECRET_${mode.toUpperCase()} or STRIPE_WEBHOOK_SECRET`
  )
}

/**
 * Get the Stripe publishable key for the current mode (client-side)
 */
export function getStripePublishableKey(): string {
  const mode = getStripeMode()

  // Try mode-specific key first
  if (mode === 'live' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE) {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
  }
  if (mode === 'test' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST) {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
  }

  // Fall back to generic key (backwards compatible)
  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  }

  return '' // Client-side, may not be needed for checkout redirect flow
}

/**
 * Check if webhook secret is configured
 */
export function isWebhookConfigured(): boolean {
  try {
    getStripeWebhookSecret()
    return true
  } catch {
    return false
  }
}

/**
 * Get Stripe configuration status (for debug endpoint)
 */
export function getStripeConfigStatus() {
  const mode = getStripeMode()
  const publishableKey = getStripePublishableKey()

  return {
    mode,
    publishableKeyPrefix: publishableKey ? publishableKey.substring(0, 12) + '...' : 'not set',
    webhookConfigured: isWebhookConfigured(),
    secretKeyConfigured: !!getStripeSecretKeySafe(),
  }
}

/**
 * Safely get secret key (returns null instead of throwing)
 */
function getStripeSecretKeySafe(): string | null {
  try {
    return getStripeSecretKey()
  } catch {
    return null
  }
}

// Singleton Stripe instance
let stripeInstance: Stripe | null = null

/**
 * Get the Stripe client instance
 */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = getStripeSecretKey()
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    })
  }
  return stripeInstance
}

/**
 * Reset the Stripe instance (for testing or mode changes)
 */
export function resetStripeInstance(): void {
  stripeInstance = null
}

// For backwards compatibility, expose as stripe
export const stripe = {
  get checkout() {
    return getStripe().checkout
  },
  get webhooks() {
    return getStripe().webhooks
  },
}
