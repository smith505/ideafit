#!/usr/bin/env npx tsx
/**
 * Library quality gate for CI
 * Fails build if any candidate doesn't meet minimum quality standards
 * Run: npx tsx scripts/check-library-quality.ts
 */

import { validateLibrary } from '../src/lib/validate-library'

const result = validateLibrary()

console.log('\n📚 Library Quality Check\n')
console.log(`Total candidates: ${result.quality.totalCandidates}`)
console.log(`Passing: ${result.quality.passingCandidates}`)
console.log('')
console.log(`Competitor coverage: ${result.quality.competitorCoverage}`)
console.log(`User quotes coverage: ${result.quality.vocCoverage}`)
console.log(`Positioning coverage: ${result.quality.wedgeCoverage}`)
console.log(`MVP-in coverage: ${result.quality.mvpInCoverage}`)
console.log(`MVP-out coverage: ${result.quality.mvpOutCoverage}`)

if (!result.valid) {
  console.log('\n❌ Quality check FAILED\n')
  result.errors.forEach((e) => console.log(`  - ${e}`))
  process.exit(1)
}

console.log('\n✅ All candidates pass quality checks\n')
process.exit(0)
