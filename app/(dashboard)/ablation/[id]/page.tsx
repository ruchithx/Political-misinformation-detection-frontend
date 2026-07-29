'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { VerdictCard } from '@/components/analysis/VerdictCard';
import { ModalityBars } from '@/components/analysis/ModalityBars';
import { ConfidenceGauge } from '@/components/analysis/ConfidenceGauge';
import { SentenceHighlighter } from '@/components/analysis/SentenceHighlighter';
import { TopTokensCard } from '@/components/analysis/TopTokensCard';
import { FeatureMetricsCard } from '@/components/analysis/FeatureMetricsCard';
import { SocialContextPanel } from '@/components/analysis/SocialContextPanel';
import { AblationChart } from '@/components/ablation/AblationChart';
import {
  ABLATION_DATA,
  VERDICT_CONFIG,
  MODALITY_CONFIG,
} from '@/lib/constants';
import { useHistory } from '@/hooks/useHistory';
import type { AnalysisResult } from '@/lib/types';

// ── Helper: get prob_fake for a specific variant from ablationData ──
function getVariantScore(
  ablationData: AnalysisResult['ablationData'],
  variant: string,
): number | null {
  if (!ablationData) return null;
  const entry = ablationData.find((a) => a.variant === variant);
  // Only return a real score — null means this variant was not run
  return entry?.prob_fake != null ? entry.prob_fake * 100 : null;
}

// ── Helper: which modalities were actually provided ──────────────────
// Derived from ablationData: if text_only is present → text was provided,
// if image_only is present → image was provided, etc.
function deriveProvidedModalities(
  ablationData: AnalysisResult['ablationData'],
): Set<'text' | 'image' | 'social'> {
  const provided = new Set<'text' | 'image' | 'social'>();
  if (!ablationData) return provided;

  const variantNames = ablationData.map((a) => a.variant);

  // If any text-using variant ran, text was provided
  if (
    variantNames.some((v) =>
      ['text_only', 'text_image', 'text_social', 'full_multimodal'].includes(v),
    )
  ) {
    provided.add('text');
  }
  // If any image-using variant ran, image was provided
  if (
    variantNames.some((v) =>
      ['image_only', 'text_image', 'full_multimodal'].includes(v),
    )
  ) {
    provided.add('image');
  }
  // If any social-using variant ran, social was provided
  if (
    variantNames.some((v) =>
      ['social_only', 'text_social', 'full_multimodal'].includes(v),
    )
  ) {
    provided.add('social');
  }

  return provided;
}

export default function ResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getById } = useHistory();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  console.log('🚀 ~ ResultDetailPage ~ result:', result);
  const [jsonOpen, setJsonOpen] = useState(false);

  useEffect(() => {
    const found = getById(id) ?? null;
    setResult(found);
  }, [id, getById]);

  if (!result) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Result not found.</p>
      </div>
    );
  }

  // ── Derive which modalities were actually used ─────────────────────
  const providedModalities = deriveProvidedModalities(result.ablationData);
  const hasText = providedModalities.has('text');
  const hasImage = providedModalities.has('image');
  const hasSocial = providedModalities.has('social');

  // ── Get scores only for provided modalities ────────────────────────
  // Returns null if that modality was not part of this analysis run.
  // The UI uses null to decide whether to show or hide a modality card.
  const textScr = hasText
    ? (getVariantScore(result.ablationData, 'text_only') ??
      result.textScore ??
      null)
    : null;

  const imageScr = hasImage
    ? (getVariantScore(result.ablationData, 'image_only') ??
      result.imageScore ??
      null)
    : null;

  const socialScr = hasSocial
    ? (getVariantScore(result.ablationData, 'social_only') ??
      result.socialScore ??
      null)
    : null;

  // Fusion score: best available combination score
  // Priority: full_multimodal → text_image → text_social → text_only
  const fusionScr = (() => {
    for (const variant of [
      'full_multimodal',
      'text_image',
      'text_social',
      'text_only',
    ]) {
      const s = getVariantScore(result.ablationData, variant);
      if (s !== null) return s;
    }
    return result.fusionScore ?? null;
  })();

  // ── Only pass provided modality scores to ModalityBars ────────────
  // ModalityBars will skip rendering bars where score is null
  const modalityScores = {
    textScore: textScr ?? 0,
    imageScore: imageScr ?? 0,
    socialScore: socialScr ?? 0,
    fusionScore: fusionScr ?? 0,
    // Tell ModalityBars which ones to actually show
    showText: hasText,
    showImage: hasImage,
    showSocial: hasSocial,
  };

  // ── Modality cards: only the ones with real data ───────────────────
  const modalityCards = (
    [
      { key: 'text', score: textScr, show: hasText },
      { key: 'image', score: imageScr, show: hasImage },
      { key: 'social', score: socialScr, show: hasSocial },
    ] as const
  ).filter((m) => m.show && m.score !== null);

  // ── Ablation chart: only variants that were actually run ───────────
  const ablationChartData = result.ablationData ?? [];

  const verdictCfg = VERDICT_CONFIG[result.verdict];

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Back nav */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Analyze
      </Link>

      {/* Verdict banner */}
      <div
        className="rounded-2xl px-6 py-5 border"
        style={{
          backgroundColor: verdictCfg.bg,
          borderColor: `${verdictCfg.color}40`,
        }}
      >
        <VerdictCard
          verdict={result.verdict}
          confidence={result.confidence}
          platform={result.platform}
          timestamp={result.timestamp}
        />
      </div>

      {/* Modality input badges — shows what was analysed */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">
          Analysed with:
        </span>
        {(['text', 'image', 'social'] as const).map((mod) => {
          const active = providedModalities.has(mod);
          return (
            <span
              key={mod}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                active
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-50'
              }`}
            >
              {mod}
            </span>
          );
        })}
        {modalityCards.length < 3 && (
          <span className="text-xs text-muted-foreground ml-1">
            — other modalities not provided, those scores are hidden
          </span>
        )}
      </div>

      {/* Modality score cards — only for provided modalities */}
      {modalityCards.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-4 ${
            modalityCards.length === 1
              ? 'sm:grid-cols-1 max-w-xs'
              : modalityCards.length === 2
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-3'
          }`}
        >
          {modalityCards.map(({ key, score }) => {
            const cfg = MODALITY_CONFIG[key];
            return (
              <div
                key={key}
                className="rounded-xl border bg-card p-5"
                style={{ borderTopWidth: 3, borderTopColor: cfg.color }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {cfg.label}
                  </span>
                </div>
                <p
                  className="font-mono-num text-4xl font-semibold"
                  style={{ color: cfg.color }}
                >
                  {score!.toFixed(1)}
                  <span className="text-xl text-muted-foreground/60">%</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Misinformation probability
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modality bars + confidence gauge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ModalityBars {...modalityScores} />
        <ConfidenceGauge value={result.confidence} />
      </div>

      {/* Attention tokens */}
      {/* {result.top_tokens && result.top_tokens.length > 0 && (
        <TopTokensCard tokens={result.top_tokens} />
      )} */}

      {/* Feature metrics */}
      {result.features && <FeatureMetricsCard features={result.features} />}

      {/* Sentence highlighter */}
      {result.sentences && result.sentences.length > 0 && (
        <SentenceHighlighter sentences={result.sentences} />
      )}

      {/* Social context — only if social was provided */}
      {hasSocial && result.socialContext && (
        <SocialContextPanel socialContext={result.socialContext} />
      )}

      {/* Ablation chart — only shows variants that were actually run */}
      <div className="rounded-2xl border bg-card p-6">
        <h3
          className="mb-1 text-sm font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Ablation Study — Run Analysis
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          {result.ablationData && result.ablationData.length > 0
            ? `Showing ${result.ablationData.length} variant${
                result.ablationData.length !== 1 ? 's' : ''
              } based on provided modalities: ${[...providedModalities].join(', ')}`
            : 'Performance across ablation conditions for the selected text'}
        </p>
        {/* Only show "not available" note for skipped modalities */}
        {(
          [
            { mod: 'image', label: 'Image' },
            { mod: 'social', label: 'Social context' },
          ] as const
        )
          .filter(({ mod }) => !providedModalities.has(mod))
          .map(({ mod, label }) => (
            <p key={mod} className="text-xs text-amber-600 mb-1">
              ⚠ {label} modality not provided — image_only, social_only and
              combined variants are excluded
            </p>
          ))}
        <AblationChart data={ablationChartData} />
      </div>

      {/* Raw JSON */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <button
          className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-muted/50 transition-colors"
          onClick={() => setJsonOpen((o) => !o)}
          aria-expanded={jsonOpen}
        >
          <span style={{ fontFamily: 'var(--font-heading)' }}>
            Raw JSON Output
          </span>
          {jsonOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {jsonOpen && (
          <div className="border-t border-border bg-surface-900 px-6 py-4">
            <pre className="overflow-x-auto font-mono-num text-xs text-surface-400 leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(result.rawJson, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
