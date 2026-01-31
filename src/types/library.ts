/**
 * Type definitions for the IdeaFit Idea Library
 * These types match the output of scripts/ingest-library.ts
 */

export interface Competitor {
  name: string;
  url: string;
  price: string;
  gap: string;
}

export interface VoCQuote {
  url: string;
  pain_tag: string;
  quote?: string;
}

export interface RiskChecklist {
  market_risk: boolean;
  tech_risk: boolean;
  regulatory_risk: boolean;
  competition_risk: boolean;
  notes?: string;
}

export interface Candidate {
  id: string;
  name: string;
  status: string;
  track_id?: string;

  // Core fields
  wedge: string;
  mvp_in: string;
  mvp_out: string;
  first10_channel: string;
  first10_steps: string;
  keywords_checked: boolean;

  // Competitive analysis
  competitors: Competitor[];

  // Voice of Customer
  voc_quotes: VoCQuote[];

  // Risk assessment
  assumptions: string;
  risk_checklist: RiskChecklist;

  // Optional metadata
  description?: string;
  target_audience?: string;
  revenue_model?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Track {
  id: string;
  name: string;
  description?: string;
  candidate_ids: string[];
}

export interface Library {
  version: string;
  generated_at: string;
  source_file: string;
  candidates: Candidate[];
  tracks: Track[];
}

// Status constants
export const CandidateStatus = {
  DRAFT: 'draft',
  READY_V1: 'ready_v1',
} as const;

export type CandidateStatusType = typeof CandidateStatus[keyof typeof CandidateStatus];
