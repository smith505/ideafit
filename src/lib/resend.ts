/**
 * Magic link email sending
 * Uses centralized email configuration
 */

import { sendEmail, EMAIL_FROM_NAME } from './email'
import { getPublicAppUrl } from './app-url'

export async function sendMagicLink(email: string, token: string): Promise<void> {
  const baseUrl = getPublicAppUrl()
  const magicLinkUrl = `${baseUrl}/auth/magic?token=${token}`

  const result = await sendEmail({
    to: email,
    subject: 'Access your IdeaMatch report',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #d946ef); border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 18px;">IM</div>
        </div>

        <h1 style="font-size: 24px; font-weight: 600; color: #18181b; margin-bottom: 16px; text-align: center;">
          Access your report
        </h1>

        <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
          Click the button below to access your IdeaMatch report. This link expires in 24 hours.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${magicLinkUrl}" style="display: inline-block; background: #8b5cf6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px;">
            Access Report
          </a>
        </div>

        <p style="color: #a1a1aa; font-size: 14px; text-align: center;">
          If you didn't request this email, you can safely ignore it.
        </p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7; text-align: center;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
            Sent by ${EMAIL_FROM_NAME}
          </p>
        </div>
      </div>
    `,
  })

  if (!result.success) {
    console.error('[MagicLink] Failed to send email:', result.error)
    throw new Error(result.error || 'Failed to send magic link email')
  }
}
