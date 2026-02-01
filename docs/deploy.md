# IdeaMatch Deployment Guide

## Railway Deployment

### Automatic Migration
Migrations run automatically during `npm run build` via `prisma migrate deploy`.
No manual migration steps required.

### Environment Variables Required

**Core (Required)**
```bash
DATABASE_URL=postgresql://...           # Primary connection (for app queries)
DIRECT_URL=postgresql://...             # Direct connection for migrations (if DATABASE_URL is pooled)
NEXT_PUBLIC_APP_URL=https://ideamatch.co  # Your production domain (used for Stripe redirects, magic links)
ADMIN_TOKEN=your-secret-token           # Protects /admin/* and /debug/* routes
```

**Stripe (Required for payments)**
```bash
STRIPE_MODE=test                        # 'test' or 'live' - defaults to 'test' for safety
STRIPE_SECRET_KEY=sk_test_...           # Generic fallback (or use mode-specific below)
STRIPE_SECRET_KEY_TEST=sk_test_...      # Test mode secret key
STRIPE_SECRET_KEY_LIVE=sk_live_...      # Live mode secret key
STRIPE_WEBHOOK_SECRET=whsec_...         # Generic fallback
STRIPE_WEBHOOK_SECRET_TEST=whsec_...    # Test mode webhook secret
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...    # Live mode webhook secret
```

**Email (Required for magic links)**
```bash
RESEND_API_KEY=re_...                   # Resend API key
EMAIL_FROM_NAME=IdeaMatch               # Optional, defaults to 'IdeaMatch'
EMAIL_FROM_ADDRESS=noreply@ideamatch.co # Optional, defaults to 'noreply@ideamatch.co'
```

**Note:** If Railway provides a pooled connection URL (via PgBouncer), set `DIRECT_URL` to the non-pooled URL for migrations.

---

## Launch Readiness Verification

### Automated Check
```bash
# Local
npm run verify:launch

# Production (requires ADMIN_TOKEN)
ADMIN_TOKEN=your-token npm run verify:launch:prod
```

### Manual Verification Commands

```bash
BASE=https://ideamatch.co
TOKEN=your-admin-token

# Health check
curl -sI $BASE/health | egrep -i "x-ideamatch-build"

# App URL config
curl -s "$BASE/debug/app-url?token=$TOKEN" | jq .

# Stripe config
curl -s "$BASE/debug/stripe?token=$TOKEN" | jq .

# Email config
curl -s "$BASE/debug/email?token=$TOKEN" | jq .

# Database health
curl -s $BASE/debug/db | jq .
```

---

## Stripe Setup

### 1. Dashboard Configuration
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Live mode** (toggle in top left)
3. Go to **Developers → API keys**
4. Copy your live secret key (`sk_live_...`)
5. Copy your live publishable key (`pk_live_...`)

### 2. Webhook Endpoint
1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Set URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
5. Copy the **Signing secret** (`whsec_...`)

### 3. Railway Environment
```bash
STRIPE_MODE=live
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
```

---

## Resend Email Setup

### 1. Domain Verification
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain (e.g., `ideamatch.co`)
3. Add the required DNS records:

**SPF Record (TXT)**
```
Name: @ (or ideamatch.co)
Type: TXT
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Records (provided by Resend)**
Resend will provide specific DKIM records. Add them as TXT records.

**DMARC Record (TXT) - Recommended**
```
Name: _dmarc
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@ideamatch.co
```

### 2. Verify Domain
After adding DNS records, click **Verify** in Resend. This may take a few minutes to propagate.

### 3. Railway Environment
```bash
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=noreply@ideamatch.co
```

---

## Pre-Launch Checklist

### Configuration
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain (https://...)
- [ ] `STRIPE_MODE=live` for real payments
- [ ] `STRIPE_SECRET_KEY_LIVE` and `STRIPE_WEBHOOK_SECRET_LIVE` set
- [ ] Stripe webhook endpoint configured in dashboard
- [ ] `RESEND_API_KEY` set
- [ ] Resend domain verified (SPF/DKIM/DMARC records added)
- [ ] `ADMIN_TOKEN` set to a secure value

### Verification
- [ ] `npm run verify:launch:prod` passes all checks
- [ ] `/health` returns correct build SHA
- [ ] `/debug/stripe?token=...` shows `mode: "live"`
- [ ] `/debug/email?token=...` shows `resendConfigured: true`
- [ ] `/debug/app-url?token=...` shows `isProductionReady: true`

### End-to-End Test
- [ ] Complete quiz flow
- [ ] Submit email on results page
- [ ] Check email delivered (not in spam)
- [ ] Click magic link and verify access
- [ ] Complete Stripe checkout (use test card if still in test mode)
- [ ] Verify report unlocks after payment
- [ ] Export PDF

---

## Production Verification Commands

### 1. Health Check with Build Headers
```bash
BASE=https://ideamatch.co

curl -sI $BASE/health | egrep -i "cache-control|x-ideamatch-build|x-ideamatch-timestamp"
```

**Expected output:**
```
cache-control: no-store, must-revalidate
x-ideamatch-build: abc1234
x-ideamatch-timestamp: 2024-01-31T...
```

### 2. Database Health
```bash
curl -s $BASE/debug/db | jq .
```

**Expected output:**
```json
{
  "build": "abc1234",
  "db": "ok",
  "eventCountLast24h": 42,
  "latestEventAt": "2024-01-31T12:00:00.000Z",
  "timestamp": "2024-01-31T12:00:00.000Z"
}
```

### 3. Events API Sanity Check
```bash
curl -X POST $BASE/api/events \
  -H "Content-Type: application/json" \
  -d '{"event":"view_home","sessionId":"verify-deploy"}'
```

**Expected output:**
```json
{"success":true}
```

### 4. Admin Auth Protection
```bash
curl -sI $BASE/admin/metrics | head -5
```

**Expected (without token):**
```
HTTP/2 307
location: /
```

### 5. Full E2E Test Suite
```bash
npm run test:e2e:prod
```

---

## Troubleshooting

### DB Connection Issues
```bash
curl -s $BASE/debug/db
```

If `db:"error"`, check Railway logs for:
- "DATABASE_URL environment variable is not set"
- Connection timeout errors
- Migration failures

### Stripe Webhook Issues
```bash
curl -s "$BASE/debug/stripe?token=$TOKEN" | jq .
```

Check:
- `webhookConfigured: true`
- Correct `mode` for environment
- Webhook endpoint URL in Stripe dashboard

### Email Delivery Issues
```bash
curl -s "$BASE/debug/email?token=$TOKEN" | jq .
```

Check:
- `resendConfigured: true`
- `fromAddress` matches verified domain
- No `validationIssues`

Check Resend dashboard for:
- Domain verification status
- Email delivery logs
- Bounce/spam reports

### Magic Link Rate Limiting
Rate limits:
- 5 requests per email per 10 minutes
- 10 requests per IP per 10 minutes

If hitting limits, wait 10 minutes or use different IP.

---

## Debug Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `/health` | No | Build info, candidate count |
| `/debug/build` | No | Build SHA and timestamp |
| `/debug/db` | No | Database connectivity |
| `/debug/app-url` | Yes | App URL configuration |
| `/debug/stripe` | Yes | Stripe mode and config |
| `/debug/email` | Yes | Email configuration |

## Admin Endpoints

| Endpoint | Description |
|----------|-------------|
| `/admin/metrics?token=...` | Funnel analytics (7d default) |
| `/admin/library?token=...` | Candidate library management |
