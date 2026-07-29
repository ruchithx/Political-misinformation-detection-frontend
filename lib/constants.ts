import type {
  Verdict,
  ModalityKey,
  Platform,
  AblationCondition,
} from './types';

// ─── Verdict colors ───────────────────────────────────────────────────────────

export const VERDICT_CONFIG: Record<
  Verdict,
  { label: string; color: string; bg: string; border: string }
> = {
  MISINFORMATION: {
    label: 'MISINFORMATION',
    color: '#C0392B',
    bg: '#FEF0F0',
    border: '#C0392B',
  },
  CREDIBLE: {
    label: 'CREDIBLE',
    color: '#1A7A4A',
    bg: '#F0FAF4',
    border: '#1A7A4A',
  },
  REAL: {
    label: 'REAL',
    color: '#1A7A4A',
    bg: '#F0FAF4',
    border: '#1A7A4A',
  },
  UNCERTAIN: {
    label: 'UNCERTAIN',
    color: '#B8720A',
    bg: '#FFF8ED',
    border: '#B8720A',
  },
};

// ─── Modality colors ──────────────────────────────────────────────────────────

export const MODALITY_CONFIG: Record<
  ModalityKey,
  { label: string; color: string }
> = {
  text: { label: 'Text Analysis', color: '#3B6FD4' },
  image: { label: 'Image Analysis', color: '#8B5CF6' },
  social: { label: 'Social Context', color: '#0D9488' },
  fusion: { label: 'Fusion Score', color: '#F59E0B' },
};

// ─── Platform labels ──────────────────────────────────────────────────────────

export const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; icon: string }
> = {
  twitter: { label: 'Twitter / X', icon: '𝕏' },
  reddit: { label: 'Reddit', icon: '🡕' },
  facebook: { label: 'Facebook', icon: 'f' },
};

// ─── API constants ────────────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
export const LOCALSTORAGE_KEY = 'truthlens_history';

// ─── Ablation fallback data ───────────────────────────────────────────────────
//
// IMPORTANT: This is used ONLY as a last-resort fallback when a result
// has NO ablationData at all (e.g. very old saved results before the
// ablation API existed).
//
// For ALL real results and demo results, ablationData on the result
// object itself is used directly — this constant is NOT used.
//
// Currently the only real modality is TEXT. Image and social are
// placeholder until image_model.py and social_model.py are integrated.
// Therefore this fallback only contains text_only.
//
// When image and social models are ready, this can be expanded — but
// by then every result will have real ablationData so this fallback
// will rarely be reached anyway.

export const ABLATION_DATA: AblationCondition[] = [
  {
    variant: 'text_only',
    active: { text: true, image: false, social: false },
    prob_fake: 0.65,
    prob_real: 0.35,
    verdict: 'FAKE',
    is_placeholder: false,
  },
  // image_only, social_only, text_image, text_social, full_multimodal
  // are intentionally removed from the fallback.
  // They will appear automatically in real results once those models
  // are integrated and the API returns them in ablationData.
];

// ─── Surface palette ──────────────────────────────────────────────────────────

export const SURFACE = {
  900: '#0F1117',
  800: '#1E2130',
  600: '#3D4259',
  400: '#8A8FA8',
  50: '#F4F5F8',
} as const;
