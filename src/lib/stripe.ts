import Stripe from 'stripe'

export const REPORT_PRICE_CENTS = 4900 // $49.00

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  }
  return stripeInstance
}

// For backwards compatibility, expose as stripe
// Note: This will throw at runtime if STRIPE_SECRET_KEY is not set
export const stripe = {
  get checkout() {
    return getStripe().checkout
  },
  get webhooks() {
    return getStripe().webhooks
  },
}
