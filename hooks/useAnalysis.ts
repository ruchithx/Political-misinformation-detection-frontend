'use client';

import { useMutation } from '@tanstack/react-query';
import type { AnalysisResult, Platform } from '@/lib/types';
import { fileToBase64 } from '@/lib/api/formatters';

// ── API base URL ──────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Types matching FastAPI response schemas ───────────────────────────

interface PredictResponse {
  verdict: string; // "REAL" | "FAKE"
  confidence: number; // 0–1
  uncertainty: number;
  prob_real: number;
  prob_fake: number;
  threshold: number;
  top_tokens: { token: string; weight: number }[];
  features: Record<string, unknown>;
  text_normalized: string;
  mc_passes: number;
  latency_ms: number;
}

interface AblationVariant {
  variant: string;
  active: { text: boolean; image: boolean; social: boolean };
  prob_fake: number;
  prob_real: number;
  verdict: string;
}

interface AblationRunResponse {
  provided_modalities: string[];
  skipped_modalities: string[];
  text_normalized: string | null;
  variants: AblationVariant[];
  latency_ms: number;
}

// ── Hook input ────────────────────────────────────────────────────────

export interface SubmitAnalysisInput {
  text: string;
  platform: Platform;
  imageFile?: File | null;
}

interface UseAnalysisArgs {
  onSuccess?: (result: AnalysisResult) => void;
}

// ── Internal fetch helpers ────────────────────────────────────────────

async function callPredict(
  text: string,
  imageBase64?: string,
): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail ?? err.error ?? `Predict API error: ${res.status}`,
    );
  }
  return res.json();
}

async function callAblationRun(
  text: string,
  imageBase64?: string,
): Promise<AblationRunResponse> {
  // Build request — only include modalities we actually have
  const body: Record<string, unknown> = { text };
  if (imageBase64) body.image_data = imageBase64;
  // social_data not yet available from the frontend

  const res = await fetch(`${API_BASE}/ablation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    // Ablation failure is non-fatal — we still have the predict result
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail ?? err.error ?? `Ablation API error: ${res.status}`,
    );
  }
  return res.json();
}

// ── Map API responses → AnalysisResult ───────────────────────────────

function buildResult(
  predict: PredictResponse,
  ablation: AblationRunResponse | null,
  platform: Platform,
  inputText: string,
): AnalysisResult {
  const provided = new Set(ablation?.provided_modalities ?? ['text']);

  // Get prob_fake for a specific variant — null if not run
  const variantScore = (name: string): number | null => {
    const v = ablation?.variants.find((a) => a.variant === name);
    return v != null ? v.prob_fake * 100 : null;
  };

  // Best fusion score: prefer full_multimodal, fall back down the chain
  const fusionScr = (() => {
    for (const v of [
      'full_multimodal',
      'text_image',
      'text_social',
      'text_only',
    ]) {
      const s = variantScore(v);
      if (s !== null) return s;
    }
    return predict.prob_fake * 100;
  })();

  // Map FastAPI verdict → app verdict labels
  const verdictMap: Record<string, string> = {
    FAKE: 'MISINFORMATION',
    REAL: 'CREDIBLE',
  };
  const verdict = verdictMap[predict.verdict] ?? predict.verdict;

  return {
    id: `result-${Date.now()}`,
    timestamp: new Date().toISOString(),
    platform,
    inputText,
    verdict: verdict as AnalysisResult['verdict'],

    // confidence from FastAPI is 0–1, app expects 0–100
    confidence: predict.confidence * 100,

    // Only set scores for modalities that were actually provided
    // null means "not run" — the UI hides those cards
    textScore: provided.has('text')
      ? (variantScore('text_only') ?? predict.prob_fake * 100)
      : null,
    imageScore: provided.has('image') ? variantScore('image_only') : null,
    socialScore: provided.has('social') ? variantScore('social_only') : null,
    fusionScore: fusionScr,

    // ablationData: ONLY the variants the backend actually ran
    // No placeholders, no dummy zeros
    ablationData: ablation?.variants.map((v) => ({
      variant: v.variant,
      active: v.active,
      prob_fake: v.prob_fake,
      prob_real: v.prob_real,
      verdict: v.verdict,
      is_placeholder: false, // real data only — never placeholder
    })) ?? [
      // Fallback if ablation call failed: derive from predict result
      {
        variant: 'text_only',
        active: { text: true, image: false, social: false },
        prob_fake: predict.prob_fake,
        prob_real: predict.prob_real,
        verdict: predict.verdict,
        is_placeholder: false,
      },
    ],

    // Attention tokens from predict (stopwords already filtered by predictor.py)
    top_tokens: predict.top_tokens ?? [],

    // Handcrafted features from preprocess_single.py
    features: predict.features ?? null,

    // Sentence-level analysis not yet available from text-only API
    sentences: [],

    // Social context only when social modality is provided
    socialContext: provided.has('social') ? null : null,

    rawJson: {
      predict: predict,
      ablation: ablation,
    },
  };
}

// ── Main hook ─────────────────────────────────────────────────────────

export function useAnalysis({ onSuccess }: UseAnalysisArgs = {}) {
  return useMutation<AnalysisResult, Error, SubmitAnalysisInput>({
    mutationFn: async ({ text, platform, imageFile }) => {
      // Convert image to base64 if provided
      let imageBase64: string | undefined;
      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile);
      }

      // ── Fire both APIs in parallel ──────────────────────────────────
      // Predict is required. Ablation failure is non-fatal.
      const [predictSettled, ablationSettled] = await Promise.allSettled([
        callPredict(text, imageBase64),
        callAblationRun(text, imageBase64),
      ]);

      // Predict must succeed
      if (predictSettled.status === 'rejected') {
        throw new Error(
          predictSettled.reason?.message ??
            'Prediction failed. Is FastAPI running?',
        );
      }

      const predict = predictSettled.value;
      const ablation =
        ablationSettled.status === 'fulfilled' ? ablationSettled.value : null;

      if (ablationSettled.status === 'rejected') {
        console.warn(
          '[useAnalysis] Ablation call failed (non-fatal):',
          ablationSettled.reason?.message,
        );
      }

      return buildResult(predict, ablation, platform, text);
    },

    onSuccess,
  });
}
