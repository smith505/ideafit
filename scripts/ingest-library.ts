#!/usr/bin/env npx tsx
/**
 * IdeaFit Idea Library Ingestion Script
 * Reads xlsx from parent folder and outputs library.json
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Types
interface Competitor {
  name: string;
  url: string;
  price: string;
  gap: string;
}

interface VoCQuote {
  url: string;
  pain_tag: string;
  quote?: string;
}

interface Candidate {
  id: string;
  name: string;
  status: string;
  track_id?: string;
  description?: string;
  audience?: string;
  wedge: string;
  mvp_in: string;
  mvp_out: string;
  first10_channel: string;
  first10_steps: string;
  pricing_model?: string;
  pricing_range?: string;
  keywords_checked: string;
  serp_notes?: string;
  competitors: Competitor[];
  voc_quotes: VoCQuote[];
  assumptions: string;
  risks: string;
  timebox_minutes?: number;
  notes?: string;
}

interface Track {
  id: string;
  name: string;
  candidate_ids: string[];
}

interface LibraryOutput {
  version: string;
  generated_at: string;
  source_file: string;
  candidates: Candidate[];
  tracks: Track[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Constants
const REQUIRED_STATUS = 'ready_v1';

// Utility Functions
function generateDeterministicId(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
}

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function getString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function getNumber(row: Record<string, unknown>, key: string): number | undefined {
  const value = row[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    if (!isNaN(n)) return n;
  }
  return undefined;
}

// Parsing Functions
function parseCompetitors(row: Record<string, unknown>): Competitor[] {
  const competitors: Competitor[] = [];
  for (let i = 1; i <= 5; i++) {
    const name = getString(row, `competitor_${i}_name`);
    const url = getString(row, `competitor_${i}_url`);
    const price = getString(row, `competitor_${i}_price_range`, `competitor_${i}_price`);
    const gap = getString(row, `competitor_${i}_gap`);

    if (name || url) {
      competitors.push({ name, url, price, gap });
    }
  }
  return competitors;
}

function parseVoCQuotes(row: Record<string, unknown>): VoCQuote[] {
  const quotes: VoCQuote[] = [];
  for (let i = 1; i <= 5; i++) {
    const quote = getString(row, `voc_${i}_quote`);
    const url = getString(row, `voc_${i}_url`);
    const pain_tag = getString(row, `voc_${i}_pain_tag`);

    if (quote || url || pain_tag) {
      quotes.push({ url, pain_tag, ...(quote && { quote }) });
    }
  }
  return quotes;
}

function parseCandidate(row: Record<string, unknown>, rowIndex: number): Candidate {
  const name = getString(row, 'idea_name', 'name') || `Untitled-${rowIndex}`;
  const xlsxId = getString(row, 'id');
  const id = xlsxId || generateDeterministicId(`${name}-${rowIndex}`);

  // Build SERP notes from multiple fields
  const serpParts: string[] = [];
  const toolsVsBlogs = getString(row, 'serp_tools_vs_blogs');
  const adsSeen = getString(row, 'serp_ads_seen');
  const intentNotes = getString(row, 'serp_intent_notes');
  if (toolsVsBlogs) serpParts.push(`Tools vs Blogs: ${toolsVsBlogs}`);
  if (adsSeen) serpParts.push(`Ads: ${adsSeen}`);
  if (intentNotes) serpParts.push(intentNotes);

  return {
    id,
    name,
    status: getString(row, 'status') || 'draft',
    track_id: getString(row, 'track', 'track_id') || undefined,
    description: getString(row, 'two_sentence_description', 'description') || undefined,
    audience: getString(row, 'audience', 'target_audience') || undefined,
    wedge: getString(row, 'wedge_1_sentence', 'wedge'),
    mvp_in: getString(row, 'mvp_in_bullets', 'mvp_in'),
    mvp_out: getString(row, 'mvp_out_bullets', 'mvp_out'),
    first10_channel: getString(row, 'first10_channel', 'channel'),
    first10_steps: getString(row, 'first10_steps', 'steps'),
    pricing_model: getString(row, 'pricing_model') || undefined,
    pricing_range: getString(row, 'pricing_range') || undefined,
    keywords_checked: getString(row, 'keywords_checked'),
    serp_notes: serpParts.length > 0 ? serpParts.join('; ') : undefined,
    competitors: parseCompetitors(row),
    voc_quotes: parseVoCQuotes(row),
    assumptions: getString(row, 'assumptions'),
    risks: getString(row, 'risk_checklist', 'risks'),
    timebox_minutes: getNumber(row, 'timebox_minutes'),
    notes: getString(row, 'notes') || undefined,
  };
}

// Validation
function validateReadyCandidate(candidate: Candidate, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const required = ['wedge', 'mvp_in', 'mvp_out', 'first10_channel', 'first10_steps', 'assumptions'] as const;

  for (const field of required) {
    if (!candidate[field]) {
      errors.push({ row: rowNumber, field, message: `Required field "${field}" is empty` });
    }
  }

  if (candidate.competitors.length < 3) {
    errors.push({ row: rowNumber, field: 'competitors', message: `Need 3 competitors, found ${candidate.competitors.length}` });
  }

  if (candidate.voc_quotes.length < 3) {
    errors.push({ row: rowNumber, field: 'voc_quotes', message: `Need 3 VoC quotes, found ${candidate.voc_quotes.length}` });
  }

  return errors;
}

function buildTracks(candidates: Candidate[]): Track[] {
  const trackMap = new Map<string, string[]>();
  for (const candidate of candidates) {
    if (candidate.track_id) {
      const existing = trackMap.get(candidate.track_id) || [];
      existing.push(candidate.id);
      trackMap.set(candidate.track_id, existing);
    }
  }
  return Array.from(trackMap.entries())
    .map(([name, ids]) => ({
      id: generateDeterministicId(`track-${name}`),
      name,
      candidate_ids: ids.sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function formatErrors(errors: ValidationError[]): string {
  let output = '\n╔═══════════════════════════════════════════════════════════╗\n';
  output += '║              VALIDATION ERRORS                            ║\n';
  output += '╚═══════════════════════════════════════════════════════════╝\n\n';
  for (const error of errors) {
    output += `Row ${error.row}: ${error.field} - ${error.message}\n`;
  }
  return output;
}

export function ingestLibrary(inputPath: string, outputPath: string): void {
  console.log('\n🚀 IdeaFit Library Ingestion Starting...\n');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ ERROR: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading: ${inputPath}`);
  const workbook = XLSX.readFile(inputPath);
  const sheetName = workbook.SheetNames.includes('Candidates') ? 'Candidates' : workbook.SheetNames[0];
  console.log(`📋 Using sheet: ${sheetName}`);

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  console.log(`📊 Found ${rawRows.length} rows\n`);

  const rows = rawRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeColumnName(key)] = value;
    }
    return normalized;
  });

  const candidates: Candidate[] = [];
  const allErrors: ValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    const candidate = parseCandidate(rows[i], i);
    if (candidate.status === REQUIRED_STATUS) {
      allErrors.push(...validateReadyCandidate(candidate, rowNumber));
    }
    candidates.push(candidate);
  }

  if (allErrors.length > 0) {
    console.error(formatErrors(allErrors));
    process.exit(1);
  }

  candidates.sort((a, b) => a.name.localeCompare(b.name));
  const tracks = buildTracks(candidates);

  const output: LibraryOutput = {
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    source_file: path.basename(inputPath),
    candidates,
    tracks,
  };

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  const readyCount = candidates.filter((c) => c.status === REQUIRED_STATUS).length;
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║              INGESTION COMPLETE                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n✅ ${candidates.length} candidates (${readyCount} ready)`);
  console.log(`📁 ${tracks.length} tracks`);
  console.log(`📄 Output: ${outputPath}\n`);
}

// CLI
const PROJECT_ROOT = path.join(process.cwd(), '..');
const INPUT_FILE = path.join(PROJECT_ROOT, 'IdeaFit_Idea_Library_Template.xlsx');
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'library.json');

if (require.main === module || process.argv[1]?.includes('ingest-library')) {
  ingestLibrary(INPUT_FILE, OUTPUT_FILE);
}
