# IdeaFit v1 - System Design Document

## Overview

IdeaFit is a SaaS product that helps solo founders find their best startup idea through a quiz-based fit assessment, delivering a paid report with validation data, MVP specs, and a 14-day ship plan.

**Core Flow:** Landing → Quiz → Email Gate → Paywall → Stripe → Report

**Key Principle:** No passwords v1 - email-based magic link access only.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js App Router (React Server Components)                   │
├─────────────────────────────────────────────────────────────────┤
│  /                    Landing page + CTA                        │
│  /quiz                Quiz flow (localStorage state)            │
│  /results             Email gate + teaser preview               │
│  /preview/[id]        Paywall + full preview (locked)           │
│  /report/[id]         Paid report dashboard                     │
│  /api/...             API routes (see below)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  Next.js API Routes + Server Actions                            │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/users              Create user (email)               │
│  POST /api/reports            Create report from quiz           │
│  POST /api/checkout           Create Stripe session             │
│  POST /api/webhooks/stripe    Handle payment confirmation       │
│  POST /api/magic-link         Send magic link email             │
│  GET  /api/magic-link/verify  Verify token, set cookie          │
│  POST /api/reports/[id]/regen Regenerate report section         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│  Postgres (Railway)     User, Report, Purchase, MagicLink       │
│  Stripe                 Checkout Sessions, Webhooks             │
│  Resend                 Transactional emails (magic links)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  reports    Report[]
  purchases  Purchase[]
  magicLinks MagicLink[]
}

model Report {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  // Quiz answers (JSON blob)
  quizAnswers Json

  // Computed results
  fitTrack       String          // e.g., "Chrome extension utility"
  winnerId       String          // e.g., "ext-tab-sweeper"
  rankedIdeas    String[]        // ordered list of idea IDs
  fitProfile     Json            // computed fit profile

  // Status
  status         ReportStatus    @default(PREVIEW)
  unlockedAt     DateTime?

  // Regenerations
  regensUsed     Int             @default(0)
  regensMax      Int             @default(5)
  regenExpiresAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  purchases Purchase[]
}

enum ReportStatus {
  PREVIEW    // Created but not paid
  UNLOCKED   // Paid and accessible
  EXPIRED    // Regen period ended
}

model Purchase {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  reportId        String
  report          Report   @relation(fields: [reportId], references: [id])

  stripeSessionId String   @unique
  stripePaymentId String?
  amount          Int      // cents
  credits         Int      @default(1)

  createdAt DateTime @default(now())
}

model MagicLink {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?

  createdAt DateTime @default(now())
}
```

---

## 3. Page Routes & Components

### 3.1 Landing Page (`/`)

**Purpose:** Get visitors into the quiz

**Sections:**
1. Hero: "Find Your Best Startup Idea in 7 Minutes"
2. CTA: "Take the Quick Fit Quiz (Free)"
3. Preview screenshots (3 report sections)
4. Value props: Fit → Validate → 14-day plan + Claude prompts
5. Social proof (later)

**No auth required**

---

### 3.2 Quiz Page (`/quiz`)

**Purpose:** Collect fit profile data

**State:** localStorage (survives refresh, no account needed)

**Questions (8-10):**

```typescript
const QUIZ_QUESTIONS = [
  {
    id: "time_weekly",
    question: "How many hours per week can you dedicate?",
    type: "single",
    options: [
      { value: "2-5", label: "2-5 hours" },
      { value: "6-10", label: "6-10 hours" },
      { value: "11-20", label: "11-20 hours" },
      { value: "20+", label: "20+ hours (full-time)" }
    ]
  },
  {
    id: "tech_comfort",
    question: "Your comfort with coding/no-code tools?",
    type: "single",
    options: [
      { value: "none", label: "I can't code and don't want to learn" },
      { value: "nocode", label: "I can use no-code tools" },
      { value: "some", label: "I can code simple things" },
      { value: "dev", label: "I'm a developer" }
    ]
  },
  {
    id: "support_tolerance",
    question: "How much customer support are you willing to do?",
    type: "single",
    options: [
      { value: "none", label: "Zero - I want passive income" },
      { value: "low", label: "Minimal - async email only" },
      { value: "medium", label: "Some - a few hours/week" },
      { value: "high", label: "Whatever it takes" }
    ]
  },
  {
    id: "revenue_goal",
    question: "What's your revenue goal in 6 months?",
    type: "single",
    options: [
      { value: "side", label: "$500-1k/mo (side income)" },
      { value: "ramen", label: "$2-5k/mo (ramen profitable)" },
      { value: "salary", label: "$5-10k/mo (replace salary)" },
      { value: "scale", label: "$10k+/mo (scale)" }
    ]
  },
  {
    id: "build_preference",
    question: "How do you prefer to build?",
    type: "single",
    options: [
      { value: "solo", label: "Solo - I do everything" },
      { value: "ai", label: "Solo + AI assistants" },
      { value: "freelance", label: "Outsource dev/design" },
      { value: "cofounder", label: "Looking for a cofounder" }
    ]
  },
  {
    id: "audience_access",
    question: "Do you have access to any of these audiences?",
    type: "multi",
    options: [
      { value: "developers", label: "Developers" },
      { value: "smb", label: "Small business owners" },
      { value: "creators", label: "Creators/influencers" },
      { value: "enterprise", label: "Enterprise contacts" },
      { value: "none", label: "No existing audience" }
    ]
  },
  {
    id: "risk_tolerance",
    question: "Your risk tolerance?",
    type: "single",
    options: [
      { value: "low", label: "Low - I need validation before building" },
      { value: "medium", label: "Medium - I'll build an MVP to test" },
      { value: "high", label: "High - I'll ship fast and iterate" }
    ]
  },
  {
    id: "existing_skills",
    question: "What skills do you bring? (select all)",
    type: "multi",
    options: [
      { value: "design", label: "Design/UI" },
      { value: "marketing", label: "Marketing/Growth" },
      { value: "sales", label: "Sales" },
      { value: "writing", label: "Writing/Content" },
      { value: "coding", label: "Coding" },
      { value: "ops", label: "Operations" }
    ]
  }
];
```

**UI:**
- Progress bar (step X of 8)
- One question per screen
- Back/Next buttons
- Auto-save to localStorage on each answer

---

### 3.3 Results + Email Gate (`/results`)

**Purpose:** Show teaser, capture email

**Shown (before email):**
- Fit Track name + 1-sentence why
- Winner idea title + 2 sentences description
- 1 competitor teaser (name only)
- 1 VoC quote teaser (truncated)

**Email capture:**
```
Enter your email to:
✓ See full preview
✓ Save your results
✓ Get your report link

[email input] [Continue →]
```

**On submit:**
1. Create User (if new) or find existing
2. Create Report with quiz answers
3. Compute fit profile + ranked ideas
4. Redirect to `/preview/[reportId]`

---

### 3.4 Preview + Paywall (`/preview/[id]`)

**Purpose:** Convert to payment

**Access:** Requires valid report ID + email cookie

**Shown:**
- Table of contents (sections visible but locked)
- Full winner idea title + description
- "What you'll get" list:
  - ✓ Ranked top 3-5 ideas with fit scores
  - ✓ Validator snapshot (competitors + VoC)
  - ✓ Winner spec + MVP in/out
  - ✓ 14-day ship plan
  - ✓ Claude prompt pack

**Paywall CTA:**
```
┌─────────────────────────────────────┐
│  Unlock Your IdeaFit Report         │
│                                     │
│  $49 one-time                       │
│  • Full report access               │
│  • 5 regenerations (30 days)        │
│  • PDF export                       │
│  • Claude prompt pack               │
│                                     │
│  [Unlock Report →]                  │
│                                     │
│  🔒 Secure checkout via Stripe      │
└─────────────────────────────────────┘
```

**On click:** Create Stripe Checkout session, redirect

---

### 3.5 Stripe Checkout (external)

**Flow:**
1. `POST /api/checkout` creates session with:
   - `success_url`: `/report/[id]?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/preview/[id]`
   - `customer_email`: user's email
   - `metadata`: `{ reportId, userId }`

2. User completes payment on Stripe

3. Stripe webhook `checkout.session.completed`:
   - Create Purchase record
   - Update Report status to UNLOCKED
   - Set regenExpiresAt to now + 30 days

4. User redirected to success_url

---

### 3.6 Report Dashboard (`/report/[id]`)

**Purpose:** Deliver value

**Access:** Report must be UNLOCKED + valid access token/cookie

**Sections:**

1. **Fit Profile**
   - Time: 6 hrs/week
   - Style: Solo + AI
   - Support tolerance: Low
   - etc.

2. **Winner Idea** (full card)
   - Name, description, wedge
   - Why it fits you (generated text)

3. **Ranked Ideas** (3-5 cards)
   - Fit score + 1-line reason
   - Click to expand

4. **Validator Snapshot**
   - Competitors table (name, price, gap)
   - VoC quotes (3)
   - Simple market score

5. **MVP Spec**
   - In scope (bullet list)
   - Out of scope (bullet list)

6. **14-Day Ship Plan**
   - Day-by-day tasks
   - "Done when..." criteria

7. **Prompt Pack**
   - Copy buttons for each prompt
   - Download all as .txt

**Actions:**
- Export PDF
- Regenerate section (uses 1 regen)
- "Regens remaining: 4/5"

---

## 4. API Routes

### 4.1 `POST /api/users`

```typescript
// Create or get user by email
Request: { email: string }
Response: { user: User, isNew: boolean }
```

### 4.2 `POST /api/reports`

```typescript
// Create report from quiz answers
Request: {
  email: string,
  quizAnswers: QuizAnswers
}
Response: { report: Report }

// Server computes:
// - fitTrack (from library.tracks)
// - winnerId (best match from library.candidates)
// - rankedIdeas (sorted by fit score)
// - fitProfile (structured from answers)
```

### 4.3 `POST /api/checkout`

```typescript
// Create Stripe Checkout session
Request: { reportId: string }
Response: { url: string } // Stripe Checkout URL
```

### 4.4 `POST /api/webhooks/stripe`

```typescript
// Handle Stripe webhook events
Event: checkout.session.completed
Action:
  - Create Purchase
  - Update Report.status = UNLOCKED
  - Set Report.regenExpiresAt
```

### 4.5 `POST /api/magic-link`

```typescript
// Send magic link email
Request: { email: string }
Response: { success: boolean }

// Creates MagicLink with 1hr expiry
// Sends email via Resend
```

### 4.6 `GET /api/magic-link/verify`

```typescript
// Verify magic link token
Query: { token: string }
Response: Redirect to /report/[id] + set cookie
```

### 4.7 `POST /api/reports/[id]/regen`

```typescript
// Regenerate a report section
Request: { section: string }
Response: { report: Report }

// Checks regensUsed < regensMax
// Checks regenExpiresAt > now
// Increments regensUsed
```

---

## 5. Fit Matching Algorithm

```typescript
function computeFitScore(
  candidate: Candidate,
  profile: FitProfile
): number {
  let score = 0;

  // Time match
  if (profile.timeWeekly === "2-5" && candidate.timebox_minutes <= 45) {
    score += 20;
  }

  // Tech comfort match
  if (profile.techComfort === "dev" && candidate.track_id.includes("extension")) {
    score += 15;
  }

  // Support tolerance match
  if (profile.supportTolerance === "low" && candidate.pricing_model === "one-time") {
    score += 15;
  }

  // Audience access match
  if (profile.audienceAccess.includes("smb") && candidate.audience.includes("small business")) {
    score += 20;
  }

  // Revenue goal match
  const priceNum = extractPrice(candidate.pricing_range);
  if (profile.revenueGoal === "side" && priceNum < 50) {
    score += 10;
  }

  // Completeness bonus (has all required fields)
  if (candidate.competitors.length >= 3 && candidate.voc_quotes.length >= 3) {
    score += 20;
  }

  return score;
}

function rankIdeas(
  candidates: Candidate[],
  profile: FitProfile
): RankedIdea[] {
  return candidates
    .map(c => ({
      id: c.id,
      name: c.name,
      score: computeFitScore(c, profile),
      reason: generateFitReason(c, profile)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
```

---

## 6. Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."  # $49 product

# Resend
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_APP_URL="https://ideafit.app"
MAGIC_LINK_SECRET="..." # for signing tokens
```

---

## 7. Implementation Order

### Phase 1: Core Flow (Day 1)
1. ✅ Set up Prisma + Postgres on Railway
2. ✅ Create database schema
3. ✅ Landing page
4. ✅ Quiz page with localStorage

### Phase 2: Email + Reports (Day 1-2)
5. ✅ Results page + email capture
6. ✅ Create User + Report API
7. ✅ Preview page with paywall UI
8. ✅ Report page (unlocked view)

### Phase 3: Payments (Day 2)
9. ✅ Stripe Checkout integration
10. ✅ Webhook handler
11. ✅ Purchase flow end-to-end

### Phase 4: Magic Links (Day 2-3)
12. ✅ Resend integration
13. ✅ Magic link send/verify
14. ✅ Access control middleware

### Phase 5: Polish (Day 3)
15. ✅ PDF export
16. ✅ Regeneration system
17. ✅ Prompt pack
18. ✅ Error handling + loading states

---

## 8. File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing
│   ├── quiz/
│   │   └── page.tsx                # Quiz flow
│   ├── results/
│   │   └── page.tsx                # Email gate
│   ├── preview/
│   │   └── [id]/
│   │       └── page.tsx            # Paywall
│   ├── report/
│   │   └── [id]/
│   │       └── page.tsx            # Paid report
│   └── api/
│       ├── users/
│       │   └── route.ts
│       ├── reports/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── regen/
│       │           └── route.ts
│       ├── checkout/
│       │   └── route.ts
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts
│       └── magic-link/
│           ├── route.ts
│           └── verify/
│               └── route.ts
├── components/
│   ├── quiz/
│   │   ├── QuizQuestion.tsx
│   │   ├── ProgressBar.tsx
│   │   └── QuizNav.tsx
│   ├── report/
│   │   ├── FitProfile.tsx
│   │   ├── IdeaCard.tsx
│   │   ├── CompetitorTable.tsx
│   │   ├── VoCQuotes.tsx
│   │   ├── MVPSpec.tsx
│   │   ├── ShipPlan.tsx
│   │   └── PromptPack.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client
│   ├── stripe.ts                   # Stripe client
│   ├── resend.ts                   # Resend client
│   ├── auth.ts                     # Magic link utils
│   ├── fit-algorithm.ts            # Scoring logic
│   └── quiz-questions.ts           # Question definitions
├── types/
│   └── index.ts                    # TypeScript types
└── prisma/
    └── schema.prisma
```

---

## 9. Security Considerations

1. **Report Access:** Verify user owns report via cookie/token
2. **Webhook Verification:** Validate Stripe signature
3. **Magic Link Tokens:** Sign with secret, 1hr expiry
4. **Rate Limiting:** On email send, checkout create
5. **Input Validation:** Zod schemas for all API inputs

---

## 10. Cost Estimates

| Service | Cost |
|---------|------|
| Railway Postgres | ~$5/mo (hobby) |
| Resend | Free tier (100 emails/day) |
| Stripe | 2.9% + $0.30 per transaction |
| Vercel/Railway hosting | Free tier likely sufficient |

**Break-even:** ~1 sale covers monthly costs

---

## Ready to Implement

This design document provides everything needed to build IdeaFit v1. The implementation order in Section 7 gives a clear path from zero to working product in 2-3 days.

Next step: Run `/sc:implement` with this design to start building.
