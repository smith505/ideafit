import PDFDocument from 'pdfkit'
import * as fs from 'fs'
import * as path from 'path'

// Generate versioned PDF
const VERSION = 'v1'
const doc = new PDFDocument({ margin: 50 })
const outputPath = path.join(process.cwd(), 'public', `sample-report-${VERSION}.pdf`)

// Ensure public directory exists
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
}

const writeStream = fs.createWriteStream(outputPath)
doc.pipe(writeStream)

// Header
doc
  .fontSize(28)
  .fillColor('#8b5cf6')
  .text('IdeaMatch Report', { align: 'center' })
  .moveDown(0.5)

doc
  .fontSize(12)
  .fillColor('#71717a')
  .text('Sample Report Preview', { align: 'center' })
  .moveDown(2)

// Fit Profile Section
doc
  .fontSize(18)
  .fillColor('#18181b')
  .text('Your Fit Profile')
  .moveDown(0.5)

doc.fontSize(11).fillColor('#52525b')

const profileItems = [
  ['Weekly Hours', '6-10 hours'],
  ['Tech Comfort', 'Developer'],
  ['Support Tolerance', 'Low - async email only'],
  ['Revenue Goal', '$2-5k/mo (ramen profitable)'],
  ['Build Style', 'Solo + AI assistants'],
  ['Risk Tolerance', 'Medium - build quick MVP'],
]

profileItems.forEach(([label, value]) => {
  doc.text(`${label}: `, { continued: true }).fillColor('#18181b').text(value).fillColor('#52525b')
})

doc.moveDown(2)

// Winner Section
doc
  .fontSize(18)
  .fillColor('#18181b')
  .text('Your #1 Match: Tab Sweeper for Work Sessions')
  .moveDown(0.5)

doc
  .fontSize(14)
  .fillColor('#8b5cf6')
  .text('87% Match', { continued: true })
  .fillColor('#71717a')
  .text('  -  Chrome extension utility')
  .moveDown(0.5)

doc
  .fontSize(11)
  .fillColor('#52525b')
  .text(
    'A Chrome extension that auto-groups and hibernates tabs by project with one-click restore. ' +
      "It shows a simple weekly 'time saved' dashboard so users feel the payoff."
  )
  .moveDown(1)

doc
  .fontSize(12)
  .fillColor('#18181b')
  .text('The Wedge')
  .moveDown(0.3)

doc
  .fontSize(11)
  .fillColor('#52525b')
  .text(
    "Unlike heavy tab managers, it's one-button 'clean my session' with zero setup " +
      'and a weekly savings score that makes the habit stick.'
  )
  .moveDown(2)

// Competitor Section
doc
  .fontSize(18)
  .fillColor('#18181b')
  .text('Competitor Analysis')
  .moveDown(0.5)

const competitors = [
  { name: 'The Great Suspender', price: 'Free', gap: "No 'session sweep' + no savings feedback loop" },
  { name: 'OneTab', price: 'Free', gap: 'Batch list only; no auto-group + no restore UX' },
  { name: 'Workona', price: '$7+/mo', gap: 'Too heavy; setup friction for casual users' },
]

competitors.forEach((comp) => {
  doc
    .fontSize(12)
    .fillColor('#18181b')
    .text(comp.name, { continued: true })
    .fillColor('#8b5cf6')
    .text(`  ${comp.price}`)

  doc.fontSize(10).fillColor('#71717a').text(`Gap: ${comp.gap}`).moveDown(0.5)
})

doc.moveDown(1)

// MVP Section - add page break check to prevent orphan bullets
const mvpYPosition = doc.y
if (mvpYPosition > 580) {
  doc.addPage()
}

doc
  .fontSize(18)
  .fillColor('#18181b')
  .text('MVP Specification')
  .moveDown(0.5)

doc.fontSize(12).fillColor('#10b981').text('In Scope:').moveDown(0.3)

const mvpIn = ['One-click sweep', 'Auto-group by domain', 'Hibernation', 'Restore last 3 sessions', 'Weekly time-saved estimate']
mvpIn.forEach((item) => {
  doc.fontSize(11).fillColor('#52525b').text(`  - ${item}`).moveDown(0.15)
})

doc.moveDown(0.6)

doc.fontSize(12).fillColor('#ef4444').text('Out of Scope:').moveDown(0.3)

// Each out-of-scope item on its own line with proper spacing
const mvpOut = ['Team features', 'Cross-device sync', 'AI categorization']
mvpOut.forEach((item) => {
  doc.fontSize(11).fillColor('#52525b').text(`  - ${item}`).moveDown(0.15)
})

doc.moveDown(1.5)

// Blurred section indicator (using ASCII-safe dashes)
doc
  .fontSize(14)
  .fillColor('#71717a')
  .text('-----------------------------------', { align: 'center' })
  .moveDown(0.5)

doc
  .fontSize(16)
  .fillColor('#8b5cf6')
  .text('Full report includes:', { align: 'center' })
  .moveDown(0.5)

doc.fontSize(11).fillColor('#52525b')
const fullReportItems = [
  '[+] Voice of Customer quotes with source links',
  '[+] Complete 14-day ship plan',
  '[+] Claude prompts for your stack',
  '[+] 4 additional matched ideas',
  '[+] PDF export & 5 regenerations',
]
fullReportItems.forEach((item) => {
  doc.text(item, { align: 'center' })
})

doc.moveDown(2)

doc
  .fontSize(14)
  .fillColor('#8b5cf6')
  .text('Return to the site to unlock your full report', { align: 'center' })

// Footer
doc.moveDown(3)
doc.fontSize(10).fillColor('#a1a1aa').text('(c) 2026 IdeaMatch. Find your fit. Ship your idea.', { align: 'center' })

doc.end()

// Wait for file to finish writing before copying
writeStream.on('finish', () => {
  console.log(`Sample PDF generated at: ${outputPath}`)

  // Also create a legacy redirect file (for backwards compatibility)
  const legacyPath = path.join(process.cwd(), 'public', 'sample-report.pdf')
  if (fs.existsSync(legacyPath)) {
    fs.unlinkSync(legacyPath)
  }
  fs.copyFileSync(outputPath, legacyPath)
  console.log(`Legacy PDF copied to: ${legacyPath}`)
})
