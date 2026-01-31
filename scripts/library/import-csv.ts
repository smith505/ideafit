#!/usr/bin/env npx tsx
/**
 * Import candidates from CSV file
 * Run: npx tsx scripts/library/import-csv.ts path/to/candidates.csv
 *
 * Produces a JSON patch file and validation report.
 * Does NOT auto-commit to library.json - review the output first.
 */

import * as fs from 'fs'
import * as path from 'path'

interface CSVRow {
  id: string
  name: string
  status?: string
  track_id: string
  audience_mode: string
  delivery_mode: string
  description: string
  audience: string
  wedge: string
  mvp_in: string // pipe-separated
  mvp_out: string // pipe-separated
  distribution_type: string
  support_level: string
  interest_tags: string // comma-separated
  avoid_tags: string // comma-separated
  keywords: string // comma-separated
  competitors: string // JSON array string
  voc_quotes: string // JSON array string
  timebox_days: string
}

interface Candidate {
  id: string
  name: string
  status: string
  track_id: string
  audience_mode: string
  delivery_mode: string
  description: string
  audience: string
  wedge: string
  mvp_in: string[]
  mvp_out: string[]
  distribution_type: string
  support_level: string
  interest_tags: string[]
  avoid_tags: string[]
  keywords: string[]
  competitors: Array<{ name: string; price: string; gap: string }>
  voc_quotes: Array<{ quote: string; source: string; pain_tag?: string }>
  timebox_days: number
}

interface ValidationIssue {
  id: string
  field: string
  issue: string
  severity: 'error' | 'warning'
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have header row and at least one data row')
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row as unknown as CSVRow)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())
  return values
}

function rowToCandidate(row: CSVRow): Candidate {
  // Parse pipe-separated lists
  const mvpIn = row.mvp_in ? row.mvp_in.split('|').map((s) => s.trim()).filter(Boolean) : []
  const mvpOut = row.mvp_out ? row.mvp_out.split('|').map((s) => s.trim()).filter(Boolean) : []

  // Parse comma-separated lists
  const interestTags = row.interest_tags ? row.interest_tags.split(',').map((s) => s.trim()).filter(Boolean) : []
  const avoidTags = row.avoid_tags ? row.avoid_tags.split(',').map((s) => s.trim()).filter(Boolean) : []
  const keywords = row.keywords ? row.keywords.split(',').map((s) => s.trim()).filter(Boolean) : []

  // Parse JSON arrays
  let competitors: Candidate['competitors'] = []
  let vocQuotes: Candidate['voc_quotes'] = []

  try {
    if (row.competitors) {
      competitors = JSON.parse(row.competitors)
    }
  } catch {
    console.warn(`Invalid competitors JSON for ${row.id}`)
  }

  try {
    if (row.voc_quotes) {
      vocQuotes = JSON.parse(row.voc_quotes)
    }
  } catch {
    console.warn(`Invalid voc_quotes JSON for ${row.id}`)
  }

  return {
    id: row.id,
    name: row.name,
    status: row.status || 'active',
    track_id: row.track_id,
    audience_mode: row.audience_mode,
    delivery_mode: row.delivery_mode || 'online_only',
    description: row.description,
    audience: row.audience,
    wedge: row.wedge,
    mvp_in: mvpIn,
    mvp_out: mvpOut,
    distribution_type: row.distribution_type,
    support_level: row.support_level,
    interest_tags: interestTags,
    avoid_tags: avoidTags,
    keywords: keywords,
    competitors: competitors,
    voc_quotes: vocQuotes,
    timebox_days: parseInt(row.timebox_days, 10) || 14,
  }
}

function validateCandidate(c: Candidate): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Required fields
  if (!c.id) issues.push({ id: c.id || 'unknown', field: 'id', issue: 'Missing ID', severity: 'error' })
  if (!c.name) issues.push({ id: c.id, field: 'name', issue: 'Missing name', severity: 'error' })
  if (!c.track_id) issues.push({ id: c.id, field: 'track_id', issue: 'Missing track_id', severity: 'error' })
  if (!c.audience_mode) issues.push({ id: c.id, field: 'audience_mode', issue: 'Missing audience_mode', severity: 'error' })

  // Quality checks
  if (c.competitors.length < 3) {
    issues.push({ id: c.id, field: 'competitors', issue: `Only ${c.competitors.length} competitors (need 3)`, severity: 'warning' })
  }
  if (c.voc_quotes.length < 3) {
    issues.push({ id: c.id, field: 'voc_quotes', issue: `Only ${c.voc_quotes.length} VoC quotes (need 3)`, severity: 'warning' })
  }
  if (!c.wedge || c.wedge.trim().length === 0) {
    issues.push({ id: c.id, field: 'wedge', issue: 'Missing wedge', severity: 'warning' })
  }
  if (c.mvp_in.length < 7) {
    issues.push({ id: c.id, field: 'mvp_in', issue: `Only ${c.mvp_in.length} mvp_in items (need 7)`, severity: 'warning' })
  }
  if (c.mvp_out.length < 5) {
    issues.push({ id: c.id, field: 'mvp_out', issue: `Only ${c.mvp_out.length} mvp_out items (need 5)`, severity: 'warning' })
  }
  if (c.interest_tags.length === 0) {
    issues.push({ id: c.id, field: 'interest_tags', issue: 'No interest tags', severity: 'warning' })
  }
  if (c.avoid_tags.length === 0) {
    issues.push({ id: c.id, field: 'avoid_tags', issue: 'No avoid tags', severity: 'warning' })
  }

  // Delivery mode should be online_only for v1
  if (c.delivery_mode !== 'online_only') {
    issues.push({ id: c.id, field: 'delivery_mode', issue: `delivery_mode is "${c.delivery_mode}" (should be "online_only" for v1)`, severity: 'warning' })
  }

  // Audience mode validation
  if (!['consumer', 'builder', 'both'].includes(c.audience_mode)) {
    issues.push({ id: c.id, field: 'audience_mode', issue: `Invalid audience_mode: "${c.audience_mode}"`, severity: 'error' })
  }

  return issues
}

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: npx tsx scripts/library/import-csv.ts <path-to-csv>')
    process.exit(1)
  }

  const absolutePath = path.resolve(csvPath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`)
    process.exit(1)
  }

  console.log(`\n📄 Reading CSV: ${absolutePath}\n`)

  const content = fs.readFileSync(absolutePath, 'utf-8')
  const rows = parseCSV(content)
  console.log(`Found ${rows.length} rows\n`)

  const candidates: Candidate[] = []
  const allIssues: ValidationIssue[] = []

  for (const row of rows) {
    const candidate = rowToCandidate(row)
    const issues = validateCandidate(candidate)
    candidates.push(candidate)
    allIssues.push(...issues)
  }

  // Report
  const errors = allIssues.filter((i) => i.severity === 'error')
  const warnings = allIssues.filter((i) => i.severity === 'warning')

  console.log('━'.repeat(60))
  console.log('VALIDATION REPORT')
  console.log('━'.repeat(60))
  console.log(`Total candidates: ${candidates.length}`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)
  console.log('')

  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix before import):')
    for (const issue of errors) {
      console.log(`  [${issue.id}] ${issue.field}: ${issue.issue}`)
    }
    console.log('')
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (quality issues):')
    for (const issue of warnings) {
      console.log(`  [${issue.id}] ${issue.field}: ${issue.issue}`)
    }
    console.log('')
  }

  // Write output files
  const outputDir = path.dirname(absolutePath)
  const baseName = path.basename(csvPath, '.csv')
  const patchPath = path.join(outputDir, `${baseName}-patch.json`)
  const reportPath = path.join(outputDir, `${baseName}-report.txt`)

  // Write patch file
  fs.writeFileSync(patchPath, JSON.stringify({ candidates }, null, 2))
  console.log(`📦 Patch file written: ${patchPath}`)

  // Write report
  const reportLines = [
    'IMPORT VALIDATION REPORT',
    `Generated: ${new Date().toISOString()}`,
    `Source: ${csvPath}`,
    '',
    `Total: ${candidates.length} candidates`,
    `Errors: ${errors.length}`,
    `Warnings: ${warnings.length}`,
    '',
    'ISSUES:',
    ...allIssues.map((i) => `[${i.severity.toUpperCase()}] ${i.id} / ${i.field}: ${i.issue}`),
  ]
  fs.writeFileSync(reportPath, reportLines.join('\n'))
  console.log(`📋 Report written: ${reportPath}`)

  console.log('')
  if (errors.length > 0) {
    console.log('❌ Cannot proceed with import due to errors. Fix the issues and re-run.')
    process.exit(1)
  }

  console.log('✅ Validation passed. To add to library, run:')
  console.log(`   npx tsx scripts/library/add-batch.ts ${patchPath}`)
  console.log('')
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
