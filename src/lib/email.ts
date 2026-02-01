/**
 * Email configuration and helpers
 * Centralized email settings for Resend
 */

import { Resend } from 'resend'

// Email sender configuration
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'IdeaMatch'
export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@ideamatch.co'
export const EMAIL_FROM = `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`

// Resend client (lazy initialized)
let resendClient: Resend | null = null

/**
 * Get the Resend client instance
 */
export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured - emails will be logged to console')
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

/**
 * Check if Resend is properly configured
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * Validate email configuration for production
 * Returns array of issues (empty = valid)
 */
export function validateEmailConfig(): string[] {
  const issues: string[] = []

  if (!process.env.RESEND_API_KEY) {
    issues.push('RESEND_API_KEY is not set')
  }

  // Check for placeholder/default values in production
  if (process.env.NODE_ENV === 'production') {
    if (EMAIL_FROM_ADDRESS === 'noreply@ideamatch.co' && !process.env.EMAIL_FROM_ADDRESS) {
      // This is actually fine if ideamatch.co is the real domain
      // Only warn if it looks like a placeholder
    }

    if (EMAIL_FROM_ADDRESS.includes('example.com')) {
      issues.push('EMAIL_FROM_ADDRESS contains example.com placeholder')
    }

    if (EMAIL_FROM_ADDRESS.includes('localhost')) {
      issues.push('EMAIL_FROM_ADDRESS contains localhost')
    }
  }

  return issues
}

/**
 * Get email configuration status (for debug endpoint)
 */
export function getEmailConfigStatus() {
  return {
    fromName: EMAIL_FROM_NAME,
    fromAddress: EMAIL_FROM_ADDRESS,
    resendConfigured: isResendConfigured(),
    validationIssues: validateEmailConfig(),
  }
}

/**
 * Send an email using Resend
 * Falls back to console logging if Resend is not configured
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getResendClient()

  if (!client) {
    // Development fallback: log to console
    console.log('\n========== EMAIL (dev mode) ==========')
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`From: ${EMAIL_FROM}`)
    console.log('HTML content logged (check email template)')
    console.log('=======================================\n')
    return { success: true, messageId: 'dev-console-log' }
  }

  try {
    const result = await client.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (result.error) {
      console.error('[Email] Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
