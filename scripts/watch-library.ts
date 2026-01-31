#!/usr/bin/env npx tsx
/**
 * Watch mode for IdeaFit Library Ingestion
 * 
 * Watches for changes to the xlsx file and re-runs ingestion automatically.
 */

import * as chokidar from 'chokidar';
import * as path from 'path';
import { ingestLibrary } from './ingest-library';

const DATA_DIR = path.join(process.cwd(), 'data');
const INPUT_FILE = path.join(DATA_DIR, 'IdeaFit_Idea_Library_Template.xlsx');
const OUTPUT_FILE = path.join(DATA_DIR, 'library.json');

console.log('\n👀 Watch mode started');
console.log(`   Watching: ${INPUT_FILE}\n`);

// Initial run
try {
  ingestLibrary(INPUT_FILE, OUTPUT_FILE);
} catch (error) {
  console.error('Initial ingestion failed:', error);
}

// Watch for changes
const watcher = chokidar.watch(INPUT_FILE, {
  persistent: true,
  ignoreInitial: true,
});

watcher.on('change', (filePath) => {
  console.log(`\n🔄 File changed: ${path.basename(filePath)}`);
  console.log('   Re-running ingestion...\n');
  
  try {
    ingestLibrary(INPUT_FILE, OUTPUT_FILE);
  } catch (error) {
    console.error('Ingestion failed:', error);
  }
});

watcher.on('error', (error) => {
  console.error('Watcher error:', error);
});

console.log('Press Ctrl+C to stop watching.\n');
