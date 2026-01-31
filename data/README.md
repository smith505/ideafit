# IdeaFit Library Data

This directory contains the candidate library that powers IdeaFit's idea matching.

## What is a Candidate?

A **candidate** is a validated startup/product idea that can be matched to users based on their quiz answers. Each candidate includes:

- **Core metadata**: ID, name, track, audience mode, delivery mode
- **Validation data**: Competitors (3+), VoC quotes (3+), wedge positioning
- **Build spec**: MVP in-scope (7+), MVP out-scope (5+), timebox days
- **Matching tags**: Interest tags, avoid tags, distribution type, support level

## Target Mix (v2: 100 candidates)

| Audience Mode | Target | Description |
|--------------|--------|-------------|
| Consumer | 40 | Personal productivity tools (normal users) |
| Builder | 50 | Products to build and sell (entrepreneurs) |
| Both | 10 | Ideas that work for either audience |

**Note**: All candidates must have `delivery_mode: "online_only"` for v1/v2.

## Quality Requirements

Every candidate must pass these checks to ship:

| Check | Requirement |
|-------|-------------|
| `competitors` | 3+ with name, price, gap |
| `voc_quotes` | 3+ with quote, source, pain_tag |
| `wedge` | Non-empty positioning statement |
| `mvp_in` | 7+ in-scope features |
| `mvp_out` | 5+ out-of-scope items |
| `interest_tags` | At least 1 tag |
| `avoid_tags` | At least 1 tag |

Run `npm run quality:check` to validate the library.

## How to Add Candidates

### Option 1: CSV Import (Recommended for batches of 10-15)

1. Download the CSV template from `/admin/library` or create your own
2. Fill in candidate data (see schema below)
3. Run the import script:
   ```bash
   npx tsx scripts/library/import-csv.ts path/to/candidates.csv
   ```
4. Review the validation report and fix any issues
5. Add to library:
   ```bash
   npx tsx scripts/library/add-batch.ts path/to/candidates-patch.json
   ```
6. Commit:
   ```bash
   git add data/library.json && git commit -m "Add batch: [description]"
   ```

### Option 2: Manual JSON Edit

1. Edit `library.json` directly
2. Run `npm run quality:check` to validate
3. Commit changes

## CSV Schema

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | string | Yes | Unique slug (e.g., "tab-sweeper") |
| name | string | Yes | Display name |
| track_id | string | Yes | Track category (e.g., "chrome-extension") |
| audience_mode | enum | Yes | "consumer", "builder", or "both" |
| delivery_mode | enum | No | "online_only" (default), "hybrid", "offline" |
| description | string | Yes | Short description |
| audience | string | Yes | Target audience description |
| wedge | string | Yes | Why this wins against competitors |
| mvp_in | string | Yes | Pipe-separated list: "Feature 1\|Feature 2\|..." |
| mvp_out | string | Yes | Pipe-separated list: "Skip 1\|Skip 2\|..." |
| distribution_type | string | Yes | "marketplace", "seo", "communities", "ads", etc. |
| support_level | string | Yes | "low", "medium", "high" |
| interest_tags | string | Yes | Comma-separated: "tech,career" |
| avoid_tags | string | Yes | Comma-separated: "calls,support" |
| keywords | string | No | Comma-separated SEO keywords |
| competitors | JSON | Yes | Array: [{"name":"X","price":"$Y/mo","gap":"..."}] |
| voc_quotes | JSON | Yes | Array: [{"quote":"...","source":"Reddit","pain_tag":"friction"}] |
| timebox_days | number | No | Days to MVP (default: 14) |

## Validating Sources

Before adding a candidate, verify:

### Competitors
- [ ] Each competitor exists and is actively maintained
- [ ] Pricing is current (check their website)
- [ ] Gap is a real differentiator (not just opinion)

### VoC Quotes
- [ ] Source is real (link to Reddit post, tweet, forum thread)
- [ ] Quote represents actual user pain (not promotional)
- [ ] Pain tag accurately categorizes the quote

### Wedge
- [ ] Wedge is defensible (why would YOU win?)
- [ ] Not just "better UX" - needs specific angle
- [ ] Based on real competitor gaps

## Scripts

```bash
# Validate library quality
npm run quality:check

# Import from CSV
npx tsx scripts/library/import-csv.ts <file.csv>

# Add validated batch
npx tsx scripts/library/add-batch.ts <patch.json>
```

## Admin UI

In development or with ADMIN_TOKEN set:
- `/admin/library` - Browse/filter candidates, view quality status
- `/admin/metrics` - View funnel analytics

## File Structure

```
data/
├── library.json      # Main library (candidates + tracks)
└── README.md         # This file
```
