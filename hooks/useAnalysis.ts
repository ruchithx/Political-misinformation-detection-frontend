'use client';

import { useMutation } from '@tanstack/react-query';
import type {
  AnalysisResult,
  Platform,
  MediaContextResult,
  TextModelResult,
  ImageModelResult,
  MediaModelResult,
} from '@/lib/types';
import { fileToBase64 } from '@/lib/api/formatters';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

// ── Request / Response types matching FastAPI ─────────────────────────

interface PredictRequest {
  text: string;
  image?: string | null;
  caption?: string;
  ocr_text?: string;
  media_context?: Record<string, unknown> | null;
}

interface UnifiedPredictResponse {
  verdict: string;
  prob_fake: number;
  prob_real: number;
  confidence: number;
  modalities_used: string[];
  fusion_formula: string;
  text: TextModelResult;
  image: ImageModelResult | null;
  media: MediaModelResult | null;
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
  variants: AblationVariant[];
  individual_scores: {
    text: number;
    image?: number;
    social?: number;
  };
  best_variant: string | null;
  text_normalized: string | null;
  latency_ms: number;
}

// ── Hook input ────────────────────────────────────────────────────────

export interface SubmitAnalysisInput {
  text: string;
  platform: Platform;
  imageFile?: File | null;
  postUrl?: string;
  mediaContext?: Record<string, unknown>;
  socialData?: Record<string, unknown>;
}

interface UseAnalysisArgs {
  onSuccess?: (result: AnalysisResult) => void;
}

// ── Build media_context from a post URL ───────────────────────────────
// Extracts URL-derivable and text-derivable features the media model can use.

function buildMediaContext(postUrl: string, text: string): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};

  try {
    const url = new URL(postUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      ctx.platform = 'TWITTER15';
    } else if (hostname.includes('reddit.com')) {
      ctx.platform = 'web';
    } else {
      ctx.platform = 'web';
    }

    ctx.is_https = postUrl.startsWith('https') ? 1.0 : 0.0;
    ctx.domain_length = url.hostname.length;
    ctx.is_url_shortened = ['bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'buff.ly', 'goo.gl'].some(
      (s) => hostname.includes(s),
    ) ? 1.0 : 0.0;
  } catch {
    ctx.platform = 'unknown';
  }

  // Text-derived features
  ctx.hashtag_count = (text.match(/#\w+/g) ?? []).length;
  ctx.mention_count = (text.match(/@\w+/g) ?? []).length;
  ctx.title_exclamation_count = (text.match(/!/g) ?? []).length;
  ctx.title_caps_word_count = (text.match(/\b[A-Z]{2,}\b/g) ?? []).length;

  return ctx;
}

// ── API call helpers ──────────────────────────────────────────────────

async function callPredict(body: PredictRequest): Promise<UnifiedPredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let msg = `Predict API error: ${res.status}`;
    if (err.detail) {
      msg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } else if (err.error) {
      msg = err.error;
    }
    throw new Error(msg);
  }
  return res.json();
}

async function callAblationRun(body: PredictRequest): Promise<AblationRunResponse> {
  const res = await fetch(`${API_BASE}/ablation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.error ?? `Ablation API error: ${res.status}`);
  }
  return res.json();
}

async function callMediaPredict(
  socialData: Record<string, unknown>,
): Promise<MediaContextResult> {
  console.log('[callMediaPredict] Calling POST /media/predict');
  console.log('[callMediaPredict] media_data payload:', JSON.stringify(socialData));
  const res = await fetch(`${API_BASE}/media/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_data: socialData }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail ?? err.error ?? `Media predict API error: ${res.status}`,
    );
  }
  return res.json();
}

// ── Map API responses → AnalysisResult ───────────────────────────────

function buildResult(
  predict: UnifiedPredictResponse,
  ablation: AblationRunResponse | null,
  platform: Platform,
  inputText: string,
  mediaContext: MediaContextResult | null,
): AnalysisResult {
  const modalities = new Set(predict.modalities_used ?? ['text']);

  const verdict: AnalysisResult['verdict'] =
    predict.prob_fake >= 0.5 ? 'MISINFORMATION' : 'CREDIBLE';

  // Ablation variant score helper
  const variantScore = (name: string): number | null => {
    const v = ablation?.variants.find((a) => a.variant === name);
    return v != null ? v.prob_fake * 100 : null;
  };

  // Fusion score from ablation if available, else from predict fused result
  const fusionScr = (() => {
    for (const v of ['full_multimodal', 'text_image', 'text_social', 'text_only']) {
      const s = variantScore(v);
      if (s !== null) return s;
    }
    return predict.prob_fake * 100;
  })();

  return {
    id: `result-${Date.now()}`,
    timestamp: new Date().toISOString(),
    platform,
    inputText,
    verdict,

    confidence: predict.confidence * 100,

    // Per-modality scores — null when that modality was not provided
    textScore: predict.text ? predict.text.prob_fake * 100 : null,
    imageScore: predict.image ? predict.image.prob_fake * 100 : null,
    socialScore: predict.media ? predict.media.prob_fake * 100 : null,
    fusionScore: fusionScr,

    // Full per-model results
    textResult: predict.text ?? null,
    imageResult: predict.image ?? null,
    mediaResult: predict.media ?? null,
    modalities_used: predict.modalities_used,

    // Legacy convenience fields (from text model)
    uncertainty: predict.text?.uncertainty,
    prob_fake: predict.prob_fake,
    prob_real: predict.prob_real,
    top_tokens: predict.text?.top_tokens ?? [],
    features: predict.text?.features ?? null,

    // Ablation variants — from ablation API, supplemented with per-model predict scores
    // when the ablation endpoint returned only text variants or failed entirely.
    ablationData: (() => {
      const fromAblation = ablation?.variants.map((v) => ({
        variant: v.variant,
        active: v.active,
        prob_fake: v.prob_fake,
        prob_real: v.prob_real,
        verdict: v.verdict,
        is_placeholder: false,
      })) ?? [];

      const seen = new Set(fromAblation.map((v) => v.variant));
      const entries = [...fromAblation];

      if (!seen.has('text_only') && predict.text) {
        entries.push({
          variant: 'text_only',
          active: { text: true, image: false, social: false },
          prob_fake: predict.text.prob_fake,
          prob_real: predict.text.prob_real,
          verdict: predict.text.verdict,
          is_placeholder: false,
        });
      }
      if (!seen.has('image_only') && predict.image) {
        entries.push({
          variant: 'image_only',
          active: { text: false, image: true, social: false },
          prob_fake: predict.image.prob_fake,
          prob_real: predict.image.prob_real,
          verdict: predict.image.verdict,
          is_placeholder: false,
        });
      }
      if (!seen.has('social_only') && predict.media) {
        entries.push({
          variant: 'social_only',
          active: { text: false, image: false, social: true },
          prob_fake: predict.media.prob_fake,
          prob_real: predict.media.prob_real,
          verdict: predict.media.verdict,
          is_placeholder: false,
        });
      }

      // Add a fusion entry when multiple individual models are present but no combined variant exists
      const hasCombined = ['text_image', 'text_social', 'full_multimodal'].some((v) => seen.has(v));
      if (!hasCombined && entries.length > 1) {
        const fusionVariant =
          predict.image && predict.media ? 'full_multimodal' :
          predict.image ? 'text_image' :
          predict.media ? 'text_social' : null;
        if (fusionVariant) {
          entries.push({
            variant: fusionVariant,
            active: { text: true, image: !!predict.image, social: !!predict.media },
            prob_fake: predict.prob_fake,
            prob_real: predict.prob_real,
            verdict: predict.verdict,
            is_placeholder: false,
          });
        }
      }

      if (entries.length === 0) {
        entries.push({
          variant: 'text_only',
          active: { text: true, image: false, social: false },
          prob_fake: predict.text?.prob_fake ?? predict.prob_fake,
          prob_real: predict.text?.prob_real ?? predict.prob_real,
          verdict: predict.text?.verdict ?? predict.verdict,
          is_placeholder: false,
        });
      }

      return entries;
    })(),

    sentences: [],
    socialContext: null,
    rawJson: {
      predict,
      ablation,
      mediaContext,
    },
    mediaContextResult: mediaContext,
  };
}

// ── Main hook ─────────────────────────────────────────────────────────

export function useAnalysis({ onSuccess }: UseAnalysisArgs = {}) {
  return useMutation<AnalysisResult, Error, SubmitAnalysisInput>({
    mutationFn: async ({ text, platform, imageFile, postUrl, mediaContext, socialData }) => {
      // Convert image to base64 if provided
      let imageBase64: string | undefined;
      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile);
      }

      const resolvedMediaContext = socialData ?? mediaContext ?? (postUrl ? buildMediaContext(postUrl, text) : null);

      const predictBody: PredictRequest = {
        text,
        image: imageBase64 ?? null,
        media_context: resolvedMediaContext ?? null,
      };

      // ── Fire all APIs in parallel ──────────────────────────────────
      // Predict is required. Ablation + media failures are non-fatal.
      console.log('[useAnalysis] media context provided:', !!resolvedMediaContext);
      console.log('[useAnalysis] media context payload:', JSON.stringify(resolvedMediaContext));
      const [predictSettled, ablationSettled, mediaSettled] = await Promise.allSettled([
        callPredict(predictBody),
        callAblationRun(predictBody),
        callMediaPredict((resolvedMediaContext ?? {}) as Record<string, unknown>),
      ]);

      if (predictSettled.status === 'rejected') {
        const error = predictSettled.reason;
        const msg =
          typeof error === 'string'
            ? error
            : error?.message || JSON.stringify(error) || 'Prediction failed. Is FastAPI running?';
        console.error('[useAnalysis] Predict failed:', error);
        throw new Error(msg);
      }

      const predict = predictSettled.value;
      const ablation =
        ablationSettled.status === 'fulfilled' ? ablationSettled.value : null;

      if (ablationSettled.status === 'rejected') {
        console.warn('[useAnalysis] Ablation failed (non-fatal):', ablationSettled.reason?.message);
      }

      const mediaPredictionResult: MediaContextResult | null =
        mediaSettled.status === 'fulfilled'
          ? mediaSettled.value
          : null;

      if (mediaSettled.status === 'rejected') {
        console.warn(
          '[useAnalysis] Media predict call failed (non-fatal):',
          mediaSettled.reason?.message,
        );
        console.warn(
          '[useAnalysis] Check: is the FeatureAttentionMLP checkpoint loaded? ' +
          '(experiments/feature_attention_mlp/checkpoints/feature_attention_mlp.pt ' +
          'AND outputs/checkpoints/liar_only/liar_context_metadata.pkl must both exist)',
        );
      }

      return buildResult(predict, ablation, platform, text, mediaPredictionResult);
    },

    onSuccess,
  });
}
