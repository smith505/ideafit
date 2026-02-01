import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIdeaById, FitProfile } from '@/lib/fit-algorithm'
import { getBuildHeaders } from '@/lib/build-headers'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const buildHeaders = getBuildHeaders()
  const { id } = await params

  const report = await prisma.report.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!report || report.status !== 'UNLOCKED') {
    return NextResponse.json({ error: 'Report not found or not unlocked' }, { status: 404, headers: buildHeaders })
  }

  const rankedIdeas = report.rankedIdeas as Array<{
    id: string
    name: string
    score: number
    reason: string
    track: string
  }>

  const fitProfile = report.fitProfile as unknown as FitProfile
  const winner = rankedIdeas[0]
  const winnerIdea = getIdeaById(winner.id)

  // Generate HTML for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>IdeaMatch Report - ${winner.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e4e4e7; }
    .logo { font-size: 28px; font-weight: bold; color: #8b5cf6; }
    .date { color: #71717a; font-size: 14px; margin-top: 8px; }
    h1 { font-size: 24px; margin-bottom: 16px; }
    h2 { font-size: 18px; margin: 32px 0 16px; color: #3f3f46; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px; }
    h3 { font-size: 16px; margin: 16px 0 8px; }
    p { margin-bottom: 12px; color: #52525b; }
    .section { margin-bottom: 32px; }
    .winner-card { background: #f4f4f5; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
    .winner-name { font-size: 22px; font-weight: bold; color: #18181b; }
    .winner-track { display: inline-block; background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 12px; }
    .score { font-size: 18px; color: #8b5cf6; font-weight: bold; margin-bottom: 12px; }
    .profile-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .profile-item { background: #f4f4f5; padding: 12px; border-radius: 8px; }
    .profile-label { font-size: 12px; color: #71717a; text-transform: uppercase; }
    .profile-value { font-weight: 600; color: #18181b; }
    .competitor { background: #f4f4f5; padding: 16px; border-radius: 8px; margin-bottom: 12px; }
    .competitor-name { font-weight: 600; }
    .competitor-price { color: #8b5cf6; font-size: 14px; }
    .quote { background: #faf5ff; padding: 16px; border-left: 4px solid #8b5cf6; margin-bottom: 12px; font-style: italic; }
    .pain-tag { display: inline-block; background: #8b5cf6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 8px; }
    .mvp-list { padding-left: 20px; }
    .mvp-list li { margin-bottom: 8px; color: #52525b; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e4e4e7; text-align: center; color: #71717a; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">IdeaMatch Report</div>
    <div class="date">Generated ${new Date().toLocaleDateString()}</div>
  </div>

  <div class="section">
    <h2>Your #1 Match</h2>
    <div class="winner-card">
      <div class="winner-track">${winner.track}</div>
      <div class="winner-name">${winner.name}</div>
      <div class="score">${winner.score}% Match</div>
      <p>${winner.reason}</p>
      ${winnerIdea ? `<p><strong>Why this wins:</strong> ${winnerIdea.wedge}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Your Fit Profile</h2>
    <div class="profile-grid">
      <div class="profile-item">
        <div class="profile-label">Weekly Hours</div>
        <div class="profile-value">${fitProfile.timeWeekly}</div>
      </div>
      <div class="profile-item">
        <div class="profile-label">Tech Level</div>
        <div class="profile-value">${fitProfile.techComfort}</div>
      </div>
      <div class="profile-item">
        <div class="profile-label">Support Tolerance</div>
        <div class="profile-value">${fitProfile.supportTolerance}</div>
      </div>
      <div class="profile-item">
        <div class="profile-label">Revenue Goal</div>
        <div class="profile-value">${fitProfile.revenueGoal}</div>
      </div>
      <div class="profile-item">
        <div class="profile-label">Build Style</div>
        <div class="profile-value">${fitProfile.buildPreference}</div>
      </div>
      <div class="profile-item">
        <div class="profile-label">Risk Level</div>
        <div class="profile-value">${fitProfile.riskTolerance}</div>
      </div>
    </div>
  </div>

  ${winnerIdea ? `
  <div class="section">
    <h2>MVP Specification</h2>
    <h3>What to Build (In Scope)</h3>
    <ul class="mvp-list">
      ${(winnerIdea.mvp_in as string[]).map(item => `<li>${item}</li>`).join('')}
    </ul>
    <h3>What to Skip (Out of Scope)</h3>
    <ul class="mvp-list">
      ${(winnerIdea.mvp_out as string[]).map(item => `<li>${item}</li>`).join('')}
    </ul>
    <h3>Timeline</h3>
    <p>Estimated ${(winnerIdea as { timebox_days: number }).timebox_days} days to MVP</p>
  </div>

  <div class="section">
    <h2>Competitor Analysis</h2>
    ${winnerIdea.competitors.map(c => `
      <div class="competitor">
        <div class="competitor-name">${c.name}</div>
        <div class="competitor-price">${c.price}</div>
        <p>${c.gap}</p>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>Real User Quotes</h2>
    ${winnerIdea.voc_quotes.map(v => `
      <div class="quote">
        <div class="pain-tag">${v.pain_tag}</div>
        <p>"${v.quote}"</p>
        <small>- ${(v as { source?: string }).source || 'User feedback'}</small>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>How You'd Get Users</h2>
    <p><strong>Channel:</strong> ${(winnerIdea as { distribution_type: string }).distribution_type}</p>
    <p><strong>Support Level:</strong> ${(winnerIdea as { support_level: string }).support_level}</p>
  </div>
  ` : ''}

  <div class="section">
    <h2>Other Top Matches</h2>
    ${rankedIdeas.slice(1).map((idea, i) => `
      <div class="competitor">
        <div class="competitor-name">#${i + 2} ${idea.name}</div>
        <div class="competitor-price">${idea.score}% match - ${idea.track}</div>
        <p>${idea.reason}</p>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} IdeaMatch. Find your fit. Ship your idea.</p>
    <p>This report was generated for ${report.user.email}</p>
  </div>
</body>
</html>
  `.trim()

  // Return HTML as downloadable file (browser can print to PDF)
  // For a production app, you'd use puppeteer or a PDF service
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="ideamatch-report-${id}.html"`,
      ...buildHeaders,
    },
  })
}
