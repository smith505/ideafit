import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('Missing RESEND_API_KEY - emails will not be sent')
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendMagicLink(email: string, token: string) {
  if (!resend) {
    console.log(`[DEV] Magic link for ${email}: ${process.env.NEXT_PUBLIC_APP_URL}/auth/magic?token=${token}`)
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  await resend.emails.send({
    from: 'IdeaFit <noreply@ideafit.co>',
    to: email,
    subject: 'Access your IdeaFit report',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #d946ef); border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 18px;">IF</div>
        </div>

        <h1 style="font-size: 24px; font-weight: 600; color: #18181b; margin-bottom: 16px; text-align: center;">
          Access your report
        </h1>

        <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
          Click the button below to access your IdeaFit report. This link expires in 24 hours.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${baseUrl}/auth/magic?token=${token}" style="display: inline-block; background: #8b5cf6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px;">
            Access Report
          </a>
        </div>

        <p style="color: #a1a1aa; font-size: 14px; text-align: center;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `,
  })
}
