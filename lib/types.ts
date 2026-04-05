// ─── Core domain types ────────────────────────────────────────────────────────

export type Verdict = 'MISINFORMATION' | 'CREDIBLE' | 'UNCERTAIN' | 'REAL';
export type Platform = 'twitter' | 'reddit' | 'facebook';
export type ModalityKey = 'text' | 'image' | 'social' | 'fusion';

export interface SentenceScore {
  text: string;
  score: number; // 0–1 misinformation probability
  signal: string; // e.g. "Loaded language", "Factual claim"
}

export interface SocialContext {
  propagationSpeed: PropagationPoint[];
  replySentiment: SentimentSegment[];
  engagementAnomaly: number; // 0–1 anomaly score
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

export interface AnalysisResult {
  id: string;
  timestamp: string;
  platform: Platform;
  inputText: string;
  imageUrl?: string;
  verdict: Verdict;
  confidence: number; // 0–100
  textScore: number | null; // 0–100
  imageScore: number | null; // 0–100
  socialScore: number | null; // 0–100
  fusionScore: number | null; // 0–100
  sentences: SentenceScore[];
  socialContext: SocialContext | null;
  rawJson: object;

  // New backend response properties
  uncertainty?: number;
  prob_real?: number;
  prob_fake?: number;
  threshold?: number;
  top_tokens?: { token: string; weight: number }[];
  features?: {
    ner?: Record<string, number>;
    numeric?: Record<string, number>;
    emotion?: Record<string, number>;
    claim_count?: number;
  };
  ablationData?: AblationCondition[];
}

// ─── Ablation data types ──────────────────────────────────────────────────────

export interface AblationCondition {
  variant: string; // "text_only" | "image_only" | etc.
  active: {
    text: boolean;
    image: boolean;
    social: boolean;
  };
  prob_fake: number; // 0.0 – 1.0
  verdict: string; // "FAKE" | "REAL"
  is_placeholder: boolean; // true when image/social are zeros
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
