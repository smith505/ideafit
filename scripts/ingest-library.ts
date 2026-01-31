#!/usr/bin/env npx tsx
/**
 * IdeaFit Idea Library Ingestion Script
 *
 * Reads IdeaFit_Idea_Library_Template.xlsx from parent folder and outputs library.json
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

interface RiskChecklist {
  market_risk: boolean;
  tech_risk: boolean;
  regulatory_risk: boolean;
  competition_risk: boolean;
  notes?: string;
}

interface Candidate {
  id: string;
  name: string;
  status: string;
  track_id?: string;
  wedge: string;
  mvp_in: string;
  mvp_out: string;
  first10_channel: string;
  first10_steps: string;
  keywords_checked: boolean;
  competitors: Competitor[];
  voc_quotes: VoCQuote[];
  assumptions: string;
  risk_checklist: RiskChecklist;
  description?: string;
  target_audience?: string;
  revenue_model?: string;
  created_at?: string;
  updated_at?: string;
}

interface Track {
  id: string;
  name: string;
  description?: string;
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
  value?: unknown;
}

// Constants
const REQUIRED_STATUS = 'ready_v1';
const REQUIRED_FIELDS = ['wedge', 'mvp_in', 'mvp_out', 'first10_channel', 'first10_steps', 'keywords_checked', 'assumptions'] as const;
const REQUIRED_COMPETITOR_FIELDS = ['name', 'url', 'price', 'gap'] as const;
const REQUIRED_VOC_FIELDS = ['url', 'pain_tag'] as const;
const REQUIRED_COMPETITOR_COUNT = 3;
const REQUIRED_VOC_COUNT = 3;

// Utility Functions
function generateDeterministicId(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
}

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim();
    return v === 'true' || v === 'yes' || v === '1' || v === 'x' || v === '✓';
  }
  return false;
}

function parseJsonSafe<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'string') return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function tryParseJson<T>(value: unknown): T | null {
  if (!value || typeof value !== 'string') return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

function getString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

// Parsing Functions
function parseCompetitors(row: Record<string, unknown>): Competitor[] {
  const jsonCompetitors = parseJsonSafe<Competitor[]>(row['competitors'], []);
  if (jsonCompetitors.length > 0) return jsonCompetitors;

  const competitors: Competitor[] = [];
  for (let i = 1; i <= 5; i++) {
    const name = getString(row, `competitor_${i}_name`) || getString(row, `comp_${i}_name`);
    const url = getString(row, `competitor_${i}_url`) || getString(row, `comp_${i}_url`);
    const price = getString(row, `competitor_${i}_price`) || getString(row, `comp_${i}_price`);
    const gap = getString(row, `competitor_${i}_gap`) || getString(row, `comp_${i}_gap`);
    if (name || url) competitors.push({ name, url, price, gap });
  }
  return competitors;
}

function parseVoCQuotes(row: Record<string, unknown>): VoCQuote[] {
  const jsonVoC = parseJsonSafe<VoCQuote[]>(row['voc_quotes'], []);
  if (jsonVoC.length > 0) return jsonVoC;

  const quotes: VoCQuote[] = [];
  for (let i = 1; i <= 5; i++) {
    const url = getString(row, `voc_${i}_url`) || getString(row, `quote_${i}_url`);
    const pain_tag = getString(row, `voc_${i}_pain_tag`) || getString(row, `quote_${i}_pain_tag`);
    const quote = getString(row, `voc_${i}_quote`) || getString(row, `quote_${i}_text`);
    if (url || pain_tag) quotes.push({ url, pain_tag, ...(quote && { quote }) });
  }
  return quotes;
}

function parseRiskChecklist(row: Record<string, unknown>): RiskChecklist {
  const jsonRisk = tryParseJson<RiskChecklist>(row['risk_checklist']);
  if (jsonRisk) return jsonRisk;
  return {
    market_risk: parseBoolean(row['risk_market'] || row['market_risk']),
    tech_risk: parseBoolean(row['risk_tech'] || row['tech_risk']),
    regulatory_risk: parseBoolean(row['risk_regulatory'] || row['regulatory_risk']),
    competition_risk: parseBoolean(row['risk_competition'] || row['competition_risk']),
    notes: getString(row, 'risk_notes') || undefined,
  };
}

function parseCandidate(row: Record<string, unknown>, rowIndex: number): Candidate {
  const name = getString(row, 'name') || getString(row, 'idea_name') || `Untitled-${rowIndex}`;
  const status = getString(row, 'status');
  const id = generateDeterministicId(`${name}-${rowIndex}`);

  return {
    id, name, status,
    track_id: getString(row, 'track_id') || getString(row, 'track') || undefined,
    wedge: getString(row, 'wedge'),
    mvp_in: getString(row, 'mvp_in'),
    mvp_out: getString(row, 'mvp_out'),
    first10_channel: getString(row, 'first10_channel') || getString(row, 'channel'),
    first10_steps: getString(row, 'first10_steps') || getString(row, 'steps'),
    keywords_checked: parseBoolean(row['keywords_checked']),
    competitors: parseCompetitors(row),
    voc_quotes: parseVoCQuotes(row),
    assumptions: getString(row, 'assumptions'),
    risk_checklist: parseRiskChecklist(row),
    description: getString(row, 'description') || undefined,
    target_audience: getString(row, 'target_audience') || undefined,
    revenue_model: getString(row, 'revenue_model') || undefined,
    created_at: getString(row, 'created_at') || undefined,
    updated_at: getString(row, 'updated_at') || undefined,
  };
}

// Validation
function isValidUrl(str: string): boolean {
  try { new URL(str); return true; } catch { return false; }
}

function validateCompetitor(competitor: Competitor, index: number, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const field of REQUIRED_COMPETITOR_FIELDS) {
    if (!competitor[field]) {
      errors.push({ row: rowNumber, field: `competitor_${index + 1}_${field}`, message: `Competitor ${index + 1} missing: ${field}`, value: competitor[field] });
    }
  }
  if (competitor.url && !isValidUrl(competitor.url)) {
    errors.push({ row: rowNumber, field: `competitor_${index + 1}_url`, message: `Competitor ${index + 1} has invalid URL`, value: competitor.url });
  }
  return errors;
}

function validateVoCQuote(quote: VoCQuote, index: number, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const field of REQUIRED_VOC_FIELDS) {
    if (!quote[field]) {
      errors.push({ row: rowNumber, field: `voc_${index + 1}_${field}`, message: `VoC ${index + 1} missing: ${field}`, value: quote[field] });
    }
  }
  if (quote.url && !isValidUrl(quote.url)) {
    errors.push({ row: rowNumber, field: `voc_${index + 1}_url`, message: `VoC ${index + 1} has invalid URL`, value: quote.url });
  }
  return errors;
}

function validateReadyCandidate(candidate: Candidate, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (field === 'keywords_checked') continue;
    const value = candidate[field as keyof Candidate];
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push({ row: rowNumber, field, message: `Required field "${field}" is empty`, value });
    }
  }

  if (!candidate.keywords_checked) {
    errors.push({ row: rowNumber, field: 'keywords_checked', message: 'keywords_checked must be true for ready_v1', value: candidate.keywords_checked });
  }

  if (candidate.competitors.length < REQUIRED_COMPETITOR_COUNT) {
    errors.push({ row: rowNumber, field: 'competitors', message: `Need ${REQUIRED_COMPETITOR_COUNT} competitors, found ${candidate.competitors.length}`, value: candidate.competitors.length });
  }
  candidate.competitors.forEach((comp, i) => errors.push(...validateCompetitor(comp, i, rowNumber)));

  if (candidate.voc_quotes.length < REQUIRED_VOC_COUNT) {
    errors.push({ row: rowNumber, field: 'voc_quotes', message: `Need ${REQUIRED_VOC_COUNT} VoC quotes, found ${candidate.voc_quotes.length}`, value: candidate.voc_quotes.length });
  }
  candidate.voc_quotes.forEach((quote, i) => errors.push(...validateVoCQuote(quote, i, rowNumber)));

  const { market_risk, tech_risk, regulatory_risk, competition_risk } = candidate.risk_checklist;
  if (!(market_risk || tech_risk || regulatory_risk || competition_risk) && !candidate.risk_checklist.notes) {
    errors.push({ row: rowNumber, field: 'risk_checklist', message: 'Risk checklist needs at least one risk or notes', value: candidate.risk_checklist });
  }

  return errors;
}

function buildTracks(candidates: Candidate[]): Track[] {
  const trackMap = new Map<string, { name: string; candidate_ids: string[] }>();
  for (const candidate of candidates) {
    if (candidate.track_id) {
      const existing = trackMap.get(candidate.track_id);
      if (existing) existing.candidate_ids.push(candidate.id);
      else trackMap.set(candidate.track_id, { name: candidate.track_id, candidate_ids: [candidate.id] });
    }
  }
  return Array.from(trackMap.entries())
    .map(([id, data]) => ({ id: generateDeterministicId(`track-${id}`), name: data.name, candidate_ids: data.candidate_ids.sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function formatErrors(errors: ValidationError[]): string {
  const grouped = new Map<number, ValidationError[]>();
  for (const error of errors) {
    const existing = grouped.get(error.row) || [];
    existing.push(error);
    grouped.set(error.row, existing);
  }

  let output = '\n╔══════════════════════════════════════════════════════════════════╗\n';
  output += '║                    VALIDATION ERRORS                              ║\n';
  output += '╚══════════════════════════════════════════════════════════════════╝\n\n';

  for (const [row, rowErrors] of Array.from(grouped.entries()).sort((a, b) => a[0] - b[0])) {
    output += `📍 Row ${row}:\n`;
    for (const error of rowErrors) {
      output += `   ❌ ${error.field}: ${error.message}\n`;
    }
    output += '\n';
  }
  output += `Total errors: ${errors.length}\n`;
  return output;
}

export function ingestLibrary(inputPath: string, outputPath: string): void {
  console.log('\n🚀 IdeaFit Library Ingestion Starting...\n');

  if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ ERROR: Input file not found: ${inputPath}`);
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
    for (const [key, value] of Object.entries(row)) normalized[normalizeColumnName(key)] = value;
    return normalized;
  });

  const candidates: Candidate[] = [];
  const allErrors: ValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    const candidate = parseCandidate(rows[i], i);
    if (candidate.status === REQUIRED_STATUS) allErrors.push(...validateReadyCandidate(candidate, rowNumber));
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
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    INGESTION COMPLETE                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Successfully processed ${candidates.length} candidates`);
  console.log(`   📊 ${readyCount} ready for production (ready_v1)`);
  console.log(`   📁 ${tracks.length} tracks identified`);
  console.log(`\n📄 Output: ${outputPath}\n`);
}

// CLI - Read from parent folder
const PROJECT_ROOT = path.join(process.cwd(), '..');
const INPUT_FILE = path.join(PROJECT_ROOT, 'IdeaFit_Idea_Library_Template.xlsx');
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'library.json');

if (require.main === module || process.argv[1]?.includes('ingest-library')) {
  ingestLibrary(INPUT_FILE, OUTPUT_FILE);
}
