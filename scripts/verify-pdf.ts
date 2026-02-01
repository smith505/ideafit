/**
 * PDF verification script
 * Extracts text from the generated sample PDF and verifies:
 * 1. No corrupted character sequences (%\x01, '\x13, etc.)
 * 2. Expected content is present
 * 3. No hardcoded domain references
 */

import * as fs from 'fs'
import * as path from 'path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse')

const PDF_PATH = path.join(process.cwd(), 'public', 'sample-report.pdf')

interface VerificationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  extractedText: string
}

async function verifyPdf(): Promise<VerificationResult> {
  const result: VerificationResult = {
    passed: true,
    errors: [],
    warnings: [],
    extractedText: '',
  }

  // Check file exists
  if (!fs.existsSync(PDF_PATH)) {
    result.passed = false
    result.errors.push(`PDF file not found: ${PDF_PATH}`)
    return result
  }

  // Read and parse PDF
  const dataBuffer = fs.readFileSync(PDF_PATH)
  const uint8Array = new Uint8Array(dataBuffer)
  const parser = new PDFParse(uint8Array)
  const parsed = await parser.getText()
  result.extractedText = parsed.text

  console.log('\n📄 Extracted PDF text:')
  console.log('─'.repeat(50))
  console.log(result.extractedText)
  console.log('─'.repeat(50))

  // Check for corrupted character sequences
  const corruptedPatterns = [
    { pattern: /%\x01/g, name: '%\\x01 sequence' },
    { pattern: /'\x13/g, name: "'\\x13 glyph" },
    { pattern: /\x00/g, name: 'null bytes' },
    { pattern: /[\x01-\x08\x0B\x0C\x0E-\x1F]/g, name: 'control characters' },
    { pattern: /\uFFFD/g, name: 'replacement characters' },
  ]

  for (const { pattern, name } of corruptedPatterns) {
    const matches = result.extractedText.match(pattern)
    if (matches && matches.length > 0) {
      result.passed = false
      result.errors.push(`Found ${matches.length} ${name} in PDF text`)
    }
  }

  // Check for expected content
  const requiredContent = [
    'IdeaMatch Report',
    'Your Fit Profile',
    'Tab Sweeper',
    'Competitor Analysis',
    'MVP Specification',
    'Return to the site to unlock your full report',
  ]

  for (const content of requiredContent) {
    if (!result.extractedText.includes(content)) {
      result.passed = false
      result.errors.push(`Missing expected content: "${content}"`)
    }
  }

  // Check for forbidden content (hardcoded domains)
  const forbiddenContent = ['ideafit.co', 'ideafit.com', 'https://ideafit', 'http://ideafit', 'example.com']

  for (const content of forbiddenContent) {
    if (result.extractedText.toLowerCase().includes(content.toLowerCase())) {
      result.passed = false
      result.errors.push(`Found forbidden domain reference: "${content}"`)
    }
  }

  // Check for properly rendered bullets (should be hyphens now)
  if (result.extractedText.includes('- One-click sweep')) {
    console.log('✓ Bullet points rendering correctly as hyphens')
  }

  // Check for [+] markers
  if (result.extractedText.includes('[+]')) {
    console.log('✓ Checkmark alternatives rendering correctly as [+]')
  }

  return result
}

async function main() {
  console.log('\n🔍 Verifying sample PDF...\n')

  try {
    const result = await verifyPdf()

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:')
      result.errors.forEach((err) => console.log(`   - ${err}`))
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      result.warnings.forEach((warn) => console.log(`   - ${warn}`))
    }

    console.log('\n' + '═'.repeat(50))
    if (result.passed) {
      console.log('✅ PDF verification PASSED\n')
      process.exit(0)
    } else {
      console.log('❌ PDF verification FAILED\n')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Verification error:', error)
    process.exit(1)
  }
}

main()
