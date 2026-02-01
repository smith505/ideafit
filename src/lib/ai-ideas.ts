import { getOpenAI } from './openai'
import { FitProfile } from './fit-algorithm'

// Types for AI-generated ideas
export interface AIIdea {
  id: string
  name: string
  score: number
  reason: string
  track: string
  desc: string
  audience: string
  wedge: string
  mvp: string[]
  skip: string[]
  comps: Array<{ n: string; p: string; g: string }>  // name, price, gap
  pains: Array<{ q: string; s: string }>  // quote, source
  days: number
  shipPlan?: Array<{ day: string; task: string }>
  monetization?: string
  firstUsers?: string
}

// Idea matching prompt - generates 5 personalized ideas
const MATCH_PROMPT = `You are an expert startup idea matchmaker. Generate 5 specific, buildable startup/side project ideas tailored to this person's profile.

PROFILE:
- Hours/week: {timeWeekly}
- Tech skill: {techComfort}
- Revenue goal: {revenueGoal}
- Skills: {existingSkills}
- Interests: {interestThemes}
- Avoid: {avoidList}
- Quit reason: {quitReason}
- Target: {audienceMode}

Generate 5 ideas as JSON. Each idea must be:
1. Buildable within their time/skill constraints
2. Aligned with their interests, avoiding their "avoid" list
3. Specific and actionable (not vague concepts)
4. Realistic for a solo founder

JSON format:
{"ideas":[{"id":"url-slug","name":"Product Name","score":85,"reason":"1-2 sentences why this fits their profile specifically","track":"Chrome Extension|SaaS|Mobile App|Marketplace|Newsletter|Community|Tool","desc":"Clear 1-sentence product description","audience":"Specific target users","days":7}]}

Rules:
- score: 65-92 based on profile fit (be honest, not everything is 90+)
- days: realistic MVP timeline (3-14 days)
- First idea = best match
- Be specific: "Invoice generator for freelance designers" not "Business tool"
- Each idea should feel different (variety of tracks/approaches)`

// Full report expansion - adds details for paid content
const REPORT_PROMPT = `You are a startup advisor helping someone validate and launch their idea. Provide specific, actionable details.

PROFILE:
- Hours/week: {timeWeekly}
- Tech skill: {techComfort}
- Revenue goal: {revenueGoal}
- Skills: {existingSkills}

IDEA TO EXPAND:
{idea}

Generate comprehensive details as JSON:
{
  "wedge": "What makes this different from alternatives (be specific about the unique angle)",
  "mvp": ["5-7 specific MVP features - be actionable, e.g. 'One-click export to PDF' not 'Export feature'"],
  "skip": ["3-4 features to explicitly skip for v1 - things users might expect but aren't needed yet"],
  "comps": [
    {"n": "Real competitor name", "p": "Their pricing (Free/$X/mo)", "g": "Their specific weakness you can exploit"},
    {"n": "Competitor 2", "p": "Price", "g": "Gap"},
    {"n": "Competitor 3", "p": "Price", "g": "Gap"}
  ],
  "pains": [
    {"q": "Realistic user complaint about this problem (make it sound real)", "s": "Reddit/Twitter/Forum"},
    {"q": "Another pain point", "s": "Source"},
    {"q": "Third pain point", "s": "Source"}
  ],
  "shipPlan": [
    {"day": "Day 1", "task": "Specific task to complete"},
    {"day": "Day 2-3", "task": "Next milestone"},
    {"day": "Day 4-5", "task": "Core feature work"},
    {"day": "Day 6-7", "task": "Polish and launch prep"}
  ],
  "monetization": "Specific pricing strategy (e.g., 'Free tier + $9/mo Pro' or 'One-time $29')",
  "firstUsers": "Where to find your first 10 users (specific subreddits, communities, or tactics)"
}

Rules:
- comps: Use real products when possible, or realistic fictional ones
- pains: Make quotes sound authentic, not corporate
- shipPlan: Tailor to their skill level and hours available
- Be specific and actionable throughout`

function formatProfile(p: FitProfile): Record<string, string> {
  return {
    timeWeekly: p.timeWeekly || '5-10 hours',
    techComfort: p.techComfort || 'some coding experience',
    revenueGoal: p.revenueGoal || 'side income',
    existingSkills: (p.existingSkills || []).join(', ') || 'general',
    interestThemes: (p.interestThemes || []).join(', ') || 'tech, productivity',
    avoidList: (p.avoidList || []).join(', ') || 'none specified',
    quitReason: p.quitReason || 'not specified',
    audienceMode: p.audienceMode === 'consumer' ? 'consumers (B2C)' : 'businesses/creators (B2B)',
  }
}

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}

export async function generateIdeaMatches(profile: FitProfile): Promise<{
  ideas: AIIdea[]
  cost: number
}> {
  const vars = formatProfile(profile)
  const prompt = interpolate(MATCH_PROMPT, vars)

  const res = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a creative startup idea expert. Generate UNIQUE ideas each time - never repeat yourself. Output only valid JSON. Be specific and actionable.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1200,
    temperature: 1.0,  // Higher temperature for more variety
  })

  const parsed = JSON.parse(res.choices[0].message.content || '{}')
  const inTok = res.usage?.prompt_tokens || 0
  const outTok = res.usage?.completion_tokens || 0
  const cost = (inTok * 0.15 + outTok * 0.60) / 1_000_000

  const ideas: AIIdea[] = (parsed.ideas || []).map((i: Partial<AIIdea>, idx: number) => ({
    id: i.id || `idea-${idx + 1}`,
    name: i.name || 'Startup Idea',
    score: Math.min(92, Math.max(65, i.score || 75)),
    reason: i.reason || 'Good fit for your profile',
    track: i.track || 'Software',
    desc: i.desc || '',
    audience: i.audience || '',
    wedge: i.wedge || '',
    mvp: i.mvp || [],
    skip: i.skip || [],
    comps: i.comps || [],
    pains: i.pains || [],
    days: i.days || 7,
    shipPlan: i.shipPlan || [],
    monetization: i.monetization || '',
    firstUsers: i.firstUsers || '',
  }))

  return { ideas, cost }
}

export async function generateFullReport(
  profile: FitProfile,
  idea: { name: string; desc: string }
): Promise<{
  data: Partial<AIIdea>
  cost: number
}> {
  const vars = {
    ...formatProfile(profile),
    idea: `${idea.name}: ${idea.desc}`,
  }
  const prompt = interpolate(REPORT_PROMPT, vars)

  const res = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a creative startup advisor. Generate fresh, unique content each time. Output only valid JSON. Be specific and actionable.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
    temperature: 0.9,  // Higher for variety
  })

  const parsed = JSON.parse(res.choices[0].message.content || '{}')
  const inTok = res.usage?.prompt_tokens || 0
  const outTok = res.usage?.completion_tokens || 0
  const cost = (inTok * 0.15 + outTok * 0.60) / 1_000_000

  return { data: parsed, cost }
}

// Generate matches + expand top 3 for paid reports
export async function generateFullMatchReport(profile: FitProfile): Promise<{
  ideas: AIIdea[]
  totalCost: number
}> {
  const { ideas, cost: matchCost } = await generateIdeaMatches(profile)

  const expansions = await Promise.all(
    ideas.slice(0, 3).map(idea =>
      generateFullReport(profile, { name: idea.name, desc: idea.desc })
    )
  )

  const expandedIdeas = ideas.map((idea, idx) => {
    if (idx < 3 && expansions[idx]) {
      return { ...idea, ...expansions[idx].data }
    }
    return idea
  })

  const totalCost = matchCost + expansions.reduce((sum, e) => sum + e.cost, 0)

  return { ideas: expandedIdeas, totalCost }
}
