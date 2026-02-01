/**
 * Email sending functions
 * Uses centralized email configuration
 */

import { sendEmail, EMAIL_FROM_NAME } from './email'
import { getPublicAppUrl } from './app-url'

interface ReportEmailData {
  email: string
  reportId: string
  topIdeaName: string
  topIdeaScore: number
  topIdeaReason: string
}

export async function sendReportReadyEmail(data: ReportEmailData): Promise<void> {
  const baseUrl = getPublicAppUrl()
  const reportUrl = `${baseUrl}/report/${data.reportId}`

  const result = await sendEmail({
    to: data.email,
    subject: `Your IdeaMatch Report is Ready 🎯`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #f97316); border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 18px;">IM</div>
        </div>

        <h1 style="font-size: 24px; font-weight: 600; color: #18181b; margin-bottom: 8px; text-align: center;">
          Your personalized ideas are ready
        </h1>

        <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
          Based on your quiz answers, we've found the perfect ideas for you.
        </p>

        <!-- Top Match Card -->
        <div style="background: linear-gradient(135deg, #f5f3ff, #fef3c7); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <div style="display: inline-block; background: #8b5cf6; color: white; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
            🏆 TOP MATCH
          </div>
          <h2 style="font-size: 20px; font-weight: 700; color: #18181b; margin: 0 0 8px 0;">
            ${data.topIdeaName}
          </h2>
          <div style="font-size: 18px; font-weight: 600; color: #8b5cf6; margin-bottom: 8px;">
            ${data.topIdeaScore}% match
          </div>
          <p style="color: #52525b; font-size: 14px; line-height: 1.5; margin: 0;">
            ${data.topIdeaReason}
          </p>
        </div>

        <!-- What's Included -->
        <div style="margin-bottom: 32px;">
          <p style="color: #18181b; font-weight: 600; margin-bottom: 12px;">Your report includes:</p>
          <ul style="color: #52525b; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
            <li>5 personalized startup ideas</li>
            <li>Competitor analysis for each</li>
            <li>MVP scope (what to build & skip)</li>
            <li>Day-by-day ship plan</li>
            <li>Monetization strategy</li>
            <li>Where to find your first users</li>
          </ul>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #f97316); color: white; text-decoration: none; padding: 16px 40px; border-radius: 9999px; font-weight: 600; font-size: 16px;">
            View Full Report →
          </a>
        </div>

        <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #71717a; font-size: 13px; margin: 0; text-align: center;">
            <strong style="color: #18181b;">💾 Save this email</strong><br>
            This link is your permanent access to the report.
          </p>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7; text-align: center;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
            Sent by ${EMAIL_FROM_NAME}
          </p>
        </div>
      </div>
    `,
  })

  if (!result.success) {
    console.error('[ReportEmail] Failed to send email:', result.error)
    // Don't throw - email failure shouldn't block the purchase flow
  }
}

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
