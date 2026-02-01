# IdeaFit Deployment Guide

## Railway Deployment

### Automatic Migration
Migrations run automatically during `npm run build` via `prisma migrate deploy`.
No manual migration steps required.

### Environment Variables Required
```
DATABASE_URL=postgresql://...      # Primary connection (for app queries)
DIRECT_URL=postgresql://...        # Direct connection for migrations (use if DATABASE_URL is pooled)
ADMIN_TOKEN=your-secret-token      # Protects /admin/* routes
STRIPE_SECRET_KEY=sk_...           # Stripe payments
RESEND_API_KEY=re_...              # Email sending
```

**Note:** If Railway provides a pooled connection URL (via PgBouncer), set `DIRECT_URL` to the non-pooled URL for migrations. Otherwise, migrations may fail with connection errors.

## Production Verification Commands

After deploy, run these checks to verify everything is working:

### 1. Health Check with Build Headers
```bash
BASE=https://ideafit-production.up.railway.app

curl -sI $BASE/health | egrep -i "cache-control|x-ideafit-build|x-ideafit-timestamp"
```

**Expected output:**
```
cache-control: no-store, must-revalidate
x-ideafit-build: abc1234
x-ideafit-timestamp: 2024-01-31T...
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

If `db: "error"`, check:
- DATABASE_URL is set correctly in Railway
- Database is provisioned and accessible
- Migration ran successfully during build

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

**Expected output (without token):**
```
HTTP/2 307
location: /
```

**With token:**
```bash
curl -sI "$BASE/admin/metrics?token=YOUR_ADMIN_TOKEN" | head -5
```

**Expected output:**
```
HTTP/2 200
```

### 5. Full E2E Test Suite
```bash
npm run test:e2e:prod
```

## Verification Checklist

After each deploy, verify:

- [ ] `/health` returns 200 with correct build SHA
- [ ] `/debug/db` shows `db: "ok"`
- [ ] `/debug/build` shows same build SHA as `/health`
- [ ] `/api/events` accepts POST requests
- [ ] `/admin/metrics` redirects without token
- [ ] Analytics events appear in `/admin/metrics?token=...`

## Troubleshooting

### DB Connection Issues
```bash
# Check DB endpoint in debug
curl -s $BASE/debug/db

# If db:"error", check Railway logs for:
# - "DATABASE_URL environment variable is not set"
# - Connection timeout errors
# - Migration failures
```

### Missing Events
1. Check browser console for `/api/events` errors
2. Verify rate limiting isn't blocking (30 events/session/minute max)
3. Check `/debug/db` for `eventCountLast24h`

### Build Mismatch
If `/health` and `/debug/build` show different builds:
1. Check Railway isn't serving cached responses
2. Verify `no-store` cache headers are present
3. Try hard refresh in browser

## Admin URLs

- `/admin/metrics?token=ADMIN_TOKEN` - Funnel analytics (defaults to 7d)
- `/admin/library?token=ADMIN_TOKEN` - Candidate library management
- `/debug/db` - Database health (no auth required)
- `/debug/build` - Build info (no auth required)

## Creator Identity Verification

After deploy, verify the personal brand integration:

### Check Creator Footer
```bash
# Homepage
curl -s $BASE | grep -o "Built by" && echo "✓ Creator footer on homepage"

# Quiz page
curl -s $BASE/quiz | grep -o "Built by" && echo "✓ Creator footer on quiz"

# About page
curl -s $BASE/about | grep -o "Cory Smith" && echo "✓ About page loaded"

# Build Log page
curl -s $BASE/build-log | grep -o "Build Log" && echo "✓ Build Log page loaded"
```

### Share Button (Results Page)
The Share on X button is client-side rendered. Manual verification:
1. Complete quiz at `/quiz`
2. Submit email on results page
3. Verify "Share on X" button appears
4. Click to verify prefilled tweet with UTM params

### Quick Manual Test Path
1. `/` - Homepage loads, creator footer visible at bottom
2. `/about` - About page with bio, links to X/Newsletter
3. `/build-log` - Build log with recent entries, current build SHA
4. `/quiz` - Take quiz, verify footer
5. `/results` - Submit email, verify Share on X button + footer
6. `/compare?ids=...` - Compare page has footer
