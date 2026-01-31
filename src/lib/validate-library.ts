/**
 * Library data quality validator
 * Ensures all candidates meet minimum data quality requirements
 */

import library from '../../data/library.json'

interface Candidate {
  id: string
  name: string
  wedge?: string
  competitors?: Array<{ name: string; price: string; gap: string }>
  voc_quotes?: Array<{ quote: string; source: string }>
  mvp_in?: string[]
  mvp_out?: string[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  quality: LibraryQuality
}

export interface LibraryQuality {
  competitorCoverage: string
  vocCoverage: string
  mvpInCoverage: string
  mvpOutCoverage: string
  wedgeCoverage: string
  totalCandidates: number
  passingCandidates: number
}

export function validateLibrary(): ValidationResult {
  const candidates = library.candidates as Candidate[]
  const errors: string[] = []

  let competitorPass = 0
  let vocPass = 0
  let mvpInPass = 0
  let mvpOutPass = 0
  let wedgePass = 0
  let allPass = 0

  for (const c of candidates) {
    const candidateErrors: string[] = []

    // Check competitors (need 3+)
    const competitorCount = c.competitors?.length || 0
    if (competitorCount >= 3) {
      competitorPass++
    } else {
      candidateErrors.push(`only ${competitorCount} competitors (need 3)`)
    }

    // Check VoC quotes (need 3+)
    const vocCount = c.voc_quotes?.length || 0
    if (vocCount >= 3) {
      vocPass++
    } else {
      candidateErrors.push(`only ${vocCount} user quotes (need 3)`)
    }

    // Check wedge (non-empty)
    if (c.wedge && c.wedge.trim().length > 0) {
      wedgePass++
    } else {
      candidateErrors.push('missing wedge')
    }

    // Check mvp_in (need 7+)
    const mvpInCount = c.mvp_in?.length || 0
    if (mvpInCount >= 7) {
      mvpInPass++
    } else {
      candidateErrors.push(`only ${mvpInCount} mvp_in items (need 7)`)
    }

    // Check mvp_out (need 5+)
    const mvpOutCount = c.mvp_out?.length || 0
    if (mvpOutCount >= 5) {
      mvpOutPass++
    } else {
      candidateErrors.push(`only ${mvpOutCount} mvp_out items (need 5)`)
    }

    // Track fully passing candidates
    if (candidateErrors.length === 0) {
      allPass++
    } else {
      errors.push(`${c.id}: ${candidateErrors.join(', ')}`)
    }
  }

  const total = candidates.length
  const quality: LibraryQuality = {
    competitorCoverage: `${Math.round((competitorPass / total) * 100)}%`,
    vocCoverage: `${Math.round((vocPass / total) * 100)}%`,
    mvpInCoverage: `${Math.round((mvpInPass / total) * 100)}%`,
    mvpOutCoverage: `${Math.round((mvpOutPass / total) * 100)}%`,
    wedgeCoverage: `${Math.round((wedgePass / total) * 100)}%`,
    totalCandidates: total,
    passingCandidates: allPass,
  }

  return {
    valid: errors.length === 0,
    errors,
    quality,
  }
}

// Dev-only: run validation on import (will log warnings but not fail)
if (process.env.NODE_ENV === 'development') {
  const result = validateLibrary()
  if (!result.valid) {
    console.warn('[Library Validator] Data quality issues found:')
    result.errors.forEach((e) => console.warn(`  - ${e}`))
    console.warn(`[Library Validator] ${result.quality.passingCandidates}/${result.quality.totalCandidates} candidates pass all checks`)
  }
}
