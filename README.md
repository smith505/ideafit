# IdeaFit

IdeaFit is a Next.js application for managing and validating startup idea candidates.

## Getting Started

First, install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Idea Library Data Pipeline

The idea library uses a spreadsheet-to-JSON ingestion pipeline. This ensures data can be easily edited in Excel/Google Sheets while maintaining a validated, structured JSON output for the application.

### Quick Start

```bash
# Run one-time ingestion
npm run ingest

# Watch mode (auto-regenerate on file changes)
npm run ingest:watch
```

### Editing the Spreadsheet

1. **Open the spreadsheet**: `data/IdeaFit_Idea_Library_Template.xlsx`
2. **Add or edit rows** following the column structure below
3. **Set status to `ready_v1`** when an idea is fully validated
4. **Run ingestion**: `npm run ingest`
5. **Fix any validation errors** (the script will tell you exactly what's missing)

### Required Columns

| Column | Description | Required for ready_v1 |
|--------|-------------|----------------------|
| `name` | Idea name | Yes |
| `status` | `draft`, `ready_v1`, etc. | Yes |
| `track` | Category/track name | No |
| `wedge` | The pain point/wedge | Yes |
| `mvp_in` | What goes into the MVP | Yes |
| `mvp_out` | What the MVP produces | Yes |
| `first10_channel` | Channel for first 10 users | Yes |
| `first10_steps` | Steps to get first 10 users | Yes |
| `keywords_checked` | SEO keywords verified (`yes`/`no`) | Yes (must be `yes`) |
| `assumptions` | Key assumptions to test | Yes |

### Competitor Columns (3 required for ready_v1)

Each competitor needs 4 fields. Use columns like:

| Column Pattern | Description |
|----------------|-------------|
| `competitor_1_name` | Competitor name |
| `competitor_1_url` | Website URL (must be valid) |
| `competitor_1_price` | Pricing info |
| `competitor_1_gap` | Gap/weakness to exploit |

Repeat for `competitor_2_*` and `competitor_3_*`.

### VoC Quote Columns (3 required for ready_v1)

Each Voice of Customer quote needs 2 fields:

| Column Pattern | Description |
|----------------|-------------|
| `voc_1_url` | Source URL (Reddit, Twitter, etc.) |
| `voc_1_pain_tag` | Pain category tag |

Repeat for `voc_2_*` and `voc_3_*`.

### Risk Checklist Columns

| Column | Description |
|--------|-------------|
| `risk_market` | Market risk identified (`yes`/`no`) |
| `risk_tech` | Technical risk identified |
| `risk_regulatory` | Regulatory risk identified |
| `risk_competition` | Competition risk identified |
| `risk_notes` | Additional risk notes |

At least one risk must be marked or notes provided.

### Optional Columns

| Column | Description |
|--------|-------------|
| `description` | Longer description |
| `target_audience` | Target user description |
| `revenue_model` | Monetization approach |
| `created_at` | Creation date |
| `updated_at` | Last update date |

### Validation Rules

For rows with `status: ready_v1`, the ingestion script validates:

1. All required fields are non-empty
2. `keywords_checked` is `yes` or `true`
3. At least 3 competitors with name, url, price, and gap
4. All competitor URLs are valid
5. At least 3 VoC quotes with url and pain_tag
6. All VoC URLs are valid
7. Risk checklist has at least one risk or notes

### Error Messages

The script fails loudly with helpful messages:

```
╔══════════════════════════════════════════════════════════════════╗
║                    VALIDATION ERRORS                              ║
╚══════════════════════════════════════════════════════════════════╝

📍 Row 5:
   ❌ competitors: At least 3 competitors required, found 1
      Current value: 1
   ❌ voc_quotes: At least 3 VoC quotes required, found 0
      Current value: 0

Total errors: 2

💡 Tips:
   - Ensure all required fields are filled for rows with status "ready_v1"
   - Each candidate needs 3 competitors with name, url, price, and gap
   - Each candidate needs 3 VoC quotes with url and pain_tag
   - URLs must be valid (include https://)
   - Set keywords_checked to "yes" or "true" when verified
```

### Output Format

The generated `data/library.json` contains:

```json
{
  "version": "1.0.0",
  "generated_at": "2026-01-31T01:10:20.190Z",
  "source_file": "IdeaFit_Idea_Library_Template.xlsx",
  "candidates": [...],
  "tracks": [...]
}
```

- **Candidates**: Sorted alphabetically by name for stable ordering
- **IDs**: Deterministic hashes based on name + row index (stable across regenerations)
- **Tracks**: Automatically extracted and grouped from candidate `track` values

### Development Tips

1. Use `npm run ingest:watch` during active editing
2. Keep drafts as `status: draft` until all fields are complete
3. The script skips validation for non-`ready_v1` rows
4. Column names are normalized (spaces → underscores, lowercase)

---

## Project Structure

```
ideafit/
├── data/
│   ├── IdeaFit_Idea_Library_Template.xlsx  # Source spreadsheet
│   └── library.json                         # Generated output
├── scripts/
│   ├── ingest-library.ts                   # Main ingestion script
│   ├── watch-library.ts                    # Watch mode wrapper
│   └── create-template.ts                  # Template generator
├── src/
│   └── app/                                # Next.js app router
└── package.json
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [SheetJS (xlsx)](https://docs.sheetjs.com/) - Excel file parsing

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).
