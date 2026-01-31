#!/usr/bin/env npx tsx
/**
 * Add batch of candidates to library.json
 * Run: npx tsx scripts/library/add-batch.ts path/to/patch.json
 *
 * Validates for duplicates and runs quality check before committing.
 */

import * as fs from 'fs'
import * as path from 'path'

const LIBRARY_PATH = path.resolve(__dirname, '../../data/library.json')

interface Candidate {
  id: string
  name: string
  [key: string]: unknown
}

interface PatchFile {
  candidates: Candidate[]
}

interface Library {
  version: string
  generated_at: string
  source_file: string
  candidates: Candidate[]
  tracks: unknown[]
}

function main() {
  const patchPath = process.argv[2]
  if (!patchPath) {
    console.error('Usage: npx tsx scripts/library/add-batch.ts <path-to-patch.json>')
    process.exit(1)
  }

  const absolutePatchPath = path.resolve(patchPath)
  if (!fs.existsSync(absolutePatchPath)) {
    console.error(`Patch file not found: ${absolutePatchPath}`)
    process.exit(1)
  }

  console.log(`\n📦 Reading patch: ${absolutePatchPath}`)

  // Load patch
  const patchContent = fs.readFileSync(absolutePatchPath, 'utf-8')
  const patch: PatchFile = JSON.parse(patchContent)

  if (!patch.candidates || !Array.isArray(patch.candidates)) {
    console.error('Invalid patch file: missing candidates array')
    process.exit(1)
  }

  console.log(`Found ${patch.candidates.length} candidates in patch\n`)

  // Load existing library
  const libraryContent = fs.readFileSync(LIBRARY_PATH, 'utf-8')
  const library: Library = JSON.parse(libraryContent)

  console.log(`Current library has ${library.candidates.length} candidates`)

  // Check for duplicates
  const existingIds = new Set(library.candidates.map((c) => c.id))
  const duplicates = patch.candidates.filter((c) => existingIds.has(c.id))

  if (duplicates.length > 0) {
    console.error('\n❌ DUPLICATE IDs FOUND:')
    duplicates.forEach((c) => console.error(`  - ${c.id}: ${c.name}`))
    console.error('\nCannot add candidates with existing IDs. Either:')
    console.error('  1. Remove duplicates from patch')
    console.error('  2. Change IDs in patch')
    console.error('  3. Remove existing candidates first')
    process.exit(1)
  }

  // Check for duplicate IDs within patch
  const patchIds = patch.candidates.map((c) => c.id)
  const patchDuplicates = patchIds.filter((id, idx) => patchIds.indexOf(id) !== idx)
  if (patchDuplicates.length > 0) {
    console.error('\n❌ DUPLICATE IDs IN PATCH:')
    patchDuplicates.forEach((id) => console.error(`  - ${id}`))
    process.exit(1)
  }

  // Merge
  const newCandidates = [...library.candidates, ...patch.candidates]
  const newLibrary: Library = {
    ...library,
    generated_at: new Date().toISOString(),
    source_file: `batch-import-${new Date().toISOString().split('T')[0]}`,
    candidates: newCandidates,
  }

  // Write back
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(newLibrary, null, 2))
  console.log(`\n✅ Added ${patch.candidates.length} candidates`)
  console.log(`Library now has ${newCandidates.length} candidates`)

  // Run quality check
  console.log('\n🔍 Running quality check...\n')

  // Import and run validation
  const { validateLibrary } = require('../../src/lib/validate-library')
  const result = validateLibrary()

  if (!result.valid) {
    console.log('⚠️  Quality issues found:')
    result.errors.slice(0, 10).forEach((e: string) => console.log(`  - ${e}`))
    if (result.errors.length > 10) {
      console.log(`  ... and ${result.errors.length - 10} more`)
    }
  }

  console.log('\nQuality summary:')
  console.log(`  Competitor coverage: ${result.quality.competitorCoverage}`)
  console.log(`  VoC coverage: ${result.quality.vocCoverage}`)
  console.log(`  MVP In coverage: ${result.quality.mvpInCoverage}`)
  console.log(`  MVP Out coverage: ${result.quality.mvpOutCoverage}`)
  console.log(`  Wedge coverage: ${result.quality.wedgeCoverage}`)
  console.log(`  Passing: ${result.quality.passingCandidates}/${result.quality.totalCandidates}`)

  console.log('\n✅ Done. Remember to commit the changes!')
  console.log('   git add data/library.json && git commit -m "Add batch candidates"')
}

main()
