#!/usr/bin/env npx tsx
/**
 * Creates a sample IdeaMatch Idea Library Template xlsx file
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'IdeaMatch_Idea_Library_Template.xlsx');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Sample data with headers matching expected format
const sampleData = [
  {
    name: 'AI Meeting Summarizer',
    status: 'draft',
    track: 'productivity',
    wedge: 'Frustration with long meeting notes',
    mvp_in: 'Calendar integration + audio recording',
    mvp_out: 'Structured meeting summary with action items',
    first10_channel: 'Product Hunt + LinkedIn',
    first10_steps: '1. Post on PH 2. Share in productivity communities 3. DM power users',
    keywords_checked: 'no',
    competitor_1_name: 'Otter.ai',
    competitor_1_url: 'https://otter.ai',
    competitor_1_price: '$16.99/mo',
    competitor_1_gap: 'No action item extraction',
    competitor_2_name: '',
    competitor_2_url: '',
    competitor_2_price: '',
    competitor_2_gap: '',
    competitor_3_name: '',
    competitor_3_url: '',
    competitor_3_price: '',
    competitor_3_gap: '',
    voc_1_url: '',
    voc_1_pain_tag: '',
    voc_2_url: '',
    voc_2_pain_tag: '',
    voc_3_url: '',
    voc_3_pain_tag: '',
    assumptions: 'Users want automated action items',
    risk_market: 'yes',
    risk_tech: 'no',
    risk_regulatory: 'no',
    risk_competition: 'yes',
    risk_notes: 'Crowded market but differentiated by action items',
    description: 'AI-powered meeting summarizer with automatic action item extraction',
    target_audience: 'Remote workers and managers',
    revenue_model: 'SaaS subscription',
  },
  {
    name: 'Code Review Assistant',
    status: 'ready_v1',
    track: 'developer_tools',
    wedge: 'Code reviews take too long and miss issues',
    mvp_in: 'GitHub PR webhook + code diff',
    mvp_out: 'Automated code review comments with severity ratings',
    first10_channel: 'Dev Twitter + HackerNews',
    first10_steps: '1. Open source core 2. Post Show HN 3. Engage in r/programming',
    keywords_checked: 'yes',
    competitor_1_name: 'DeepCode',
    competitor_1_url: 'https://deepcode.ai',
    competitor_1_price: '$29/mo',
    competitor_1_gap: 'Limited language support',
    competitor_2_name: 'CodeClimate',
    competitor_2_url: 'https://codeclimate.com',
    competitor_2_price: '$49/mo',
    competitor_2_gap: 'No AI suggestions',
    competitor_3_name: 'SonarQube',
    competitor_3_url: 'https://sonarqube.org',
    competitor_3_price: 'Free tier + enterprise',
    competitor_3_gap: 'Complex setup, no natural language explanations',
    voc_1_url: 'https://reddit.com/r/programming/comments/example1',
    voc_1_pain_tag: 'time_waste',
    voc_2_url: 'https://news.ycombinator.com/item?id=12345',
    voc_2_pain_tag: 'quality_issues',
    voc_3_url: 'https://twitter.com/dev/status/67890',
    voc_3_pain_tag: 'onboarding',
    assumptions: 'Developers trust AI suggestions if well-explained',
    risk_market: 'yes',
    risk_tech: 'yes',
    risk_regulatory: 'no',
    risk_competition: 'yes',
    risk_notes: 'Need strong differentiation from existing tools',
    description: 'AI-powered code review assistant for GitHub',
    target_audience: 'Software development teams',
    revenue_model: 'Per-seat SaaS',
  },
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Set column widths for better readability
worksheet['!cols'] = [
  { wch: 25 }, // name
  { wch: 12 }, // status
  { wch: 15 }, // track
  { wch: 40 }, // wedge
  { wch: 35 }, // mvp_in
  { wch: 40 }, // mvp_out
  { wch: 25 }, // first10_channel
  { wch: 50 }, // first10_steps
  { wch: 12 }, // keywords_checked
  // Competitors
  { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 30 },
  { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 30 },
  { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 30 },
  // VoC
  { wch: 50 }, { wch: 15 },
  { wch: 50 }, { wch: 15 },
  { wch: 50 }, { wch: 15 },
  // Risk & meta
  { wch: 50 }, // assumptions
  { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 40 },
  { wch: 60 }, // description
  { wch: 30 }, // target_audience
  { wch: 20 }, // revenue_model
];

XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');

// Write to file
XLSX.writeFile(workbook, OUTPUT_FILE);

console.log(`\n✅ Template created: ${OUTPUT_FILE}`);
console.log('   Contains 2 sample candidates (1 draft, 1 ready_v1)\n');
