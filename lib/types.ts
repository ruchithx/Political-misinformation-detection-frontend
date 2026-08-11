// ─── Core domain types ────────────────────────────────────────────────────────

export type Verdict = 'MISINFORMATION' | 'CREDIBLE' | 'UNCERTAIN' | 'REAL';
export type Platform = 'twitter' | 'reddit' | 'facebook';
export type ModalityKey = 'text' | 'image' | 'social' | 'fusion';

export interface SentenceScore {
  text: string;
  score: number;
  signal: string;
}

export interface SocialContext {
  propagationSpeed: PropagationPoint[];
  replySentiment: SentimentSegment[];
  engagementAnomaly: number;
}

export interface PropagationPoint {
  hour: number;
  shares: number;
  velocity: number;
}

export interface SentimentSegment {
  name: string;
  value: number;
  color: string;
}

// ─── Per-model result types (nested in /predict response) ────────────────────

export interface ClaimScore {
  claim_text: string;
  prob_fake: number;
}

export interface TextModelResult {
  prob_fake: number;
  prob_real: number;
  confidence: number;
  uncertainty: number;
  verdict: string;
  top_tokens: { token: string; weight: number }[];
  features: {
    ner?: Record<string, number>;
    numeric?: Record<string, number>;
    emotion?: Record<string, number>;
    claim_count?: number;
  };
  text_normalized: string;
  mc_passes: number;
  segmentation?: {
    claims: ClaimScore[];
    seg_max: number;
    seg_mean: number;
    segmentation_flag: boolean;
    seg_n_claims: number;
  } | null;
}

export interface ImageModelResult {
  prob_fake: number;
  prob_real: number;
  confidence: number;
  verdict: string;
  pccs_score: number;
  variant: string;
}

export interface MediaTopSignal {
  feature: string;
  attention: number;
  value: number;
}

export interface MediaModelResult {
  prob_fake: number;
  prob_real: number;
  confidence: number;
  verdict: string;
  top_signals: MediaTopSignal[];
}

// ─── Main result type ─────────────────────────────────────────────────────────

export interface AnalysisResult {
  id: string;
  timestamp: string;
  platform: Platform;
  inputText: string;
  imageUrl?: string;
  verdict: Verdict;
  confidence: number; // 0–100

  // Modality scores (0–100), null = modality not provided
  textScore: number | null;
  imageScore: number | null;
  socialScore: number | null;
  fusionScore: number | null;

  // Full per-model details from unified /predict response
  textResult?: TextModelResult | null;
  imageResult?: ImageModelResult | null;
  mediaResult?: MediaModelResult | null;
  modalities_used?: string[];

  // Legacy / convenience fields (derived from textResult)
  uncertainty?: number;
  prob_real?: number;
  prob_fake?: number;
  top_tokens?: { token: string; weight: number }[];
  features?: {
    ner?: Record<string, number>;
    numeric?: Record<string, number>;
    emotion?: Record<string, number>;
    claim_count?: number;
  };

  sentences: SentenceScore[];
  socialContext: SocialContext | null;
  ablationData?: AblationCondition[];
  mediaContextResult?: MediaContextResult | null;
  rawJson?: Record<string, unknown>;
}

// ─── Media Context prediction types ─────────────────────────────────────────

export interface MediaContextResult {
  verdict: string;              // "FAKE" | "REAL"
  confidence: number;           // 0–1
  prob_real: number;            // 0–1
  prob_fake: number;            // 0–1
  attention: Record<string, number>; // per-feature attention weights
}

// ─── Ablation data types ──────────────────────────────────────────────────────

export interface AblationCondition {
  variant: string;
  active: {
    text: boolean;
    image: boolean;
    social: boolean;
  };
  prob_fake: number;
  prob_real: number;
  verdict: string;
  is_placeholder: boolean;
  label?: string;
  isWinner?: boolean;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
}

// ─── API types ────────────────────────────────────────────────────────────────

export interface AnalyzeRequest {
  text: string;
  imageBase64?: string;
  platform: Platform;
}

export interface AnalyzeResponse {
  result: AnalysisResult;
}

// ─── UI types ─────────────────────────────────────────────────────────────────

export type BackendStatus = 'up' | 'degraded' | 'down';
