'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { VerdictCard } from '@/components/analysis/VerdictCard';
import { ModalityBars } from '@/components/analysis/ModalityBars';
import { SentenceHighlighter } from '@/components/analysis/SentenceHighlighter';
import { TopTokensCard } from '@/components/analysis/TopTokensCard';
import { FeatureMetricsCard } from '@/components/analysis/FeatureMetricsCard';
import { SocialContextPanel } from '@/components/analysis/SocialContextPanel';
import { AblationChart } from '@/components/ablation/AblationChart';
import { VERDICT_CONFIG, MODALITY_CONFIG } from '@/lib/constants';
import { useHistory } from '@/hooks/useHistory';
import type { AnalysisResult } from '@/lib/types';


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

  // ── Use the same stored scores the homepage shows ─────────────────
  const textScr = result.textScore;
  const imageScr = result.imageScore;
  const socialScr = result.socialScore;
  const fusionScr = result.fusionScore;

  const hasText = textScr !== null;
  const hasImage = imageScr !== null;
  const hasSocial = socialScr !== null;

  const providedModalities = new Set<'text' | 'image' | 'social'>([
    ...(hasText ? ['text' as const] : []),
    ...(hasImage ? ['image' as const] : []),
    ...(hasSocial ? ['social' as const] : []),
  ]);

  const modalityScores = {
    textScore: textScr ?? 0,
    imageScore: imageScr ?? 0,
    socialScore: socialScr ?? 0,
    fusionScore: fusionScr ?? 0,
    showText: hasText,
    showImage: hasImage,
    showSocial: hasSocial,
  };

  const modalityCards = (
    [
      { key: 'text', score: textScr, show: hasText },
      { key: 'image', score: imageScr, show: hasImage },
      { key: 'social', score: socialScr, show: hasSocial },
    ] as const
  ).filter((m) => m.show && m.score !== null);

  // ── Build chart from stored model scores; combinations = average of members ──
  const avg = (...scores: number[]) => scores.reduce((a, b) => a + b, 0) / scores.length;

  const ablationChartData = [
    ...(textScr !== null ? [{
      variant: 'text_only',
      prob_fake: textScr / 100,
      prob_real: 1 - textScr / 100,
      verdict: result.textResult?.verdict ?? 'REAL',
      active: { text: true, image: false, social: false },
      is_placeholder: false,
    }] : []),
    ...(imageScr !== null ? [{
      variant: 'image_only',
      prob_fake: imageScr / 100,
      prob_real: 1 - imageScr / 100,
      verdict: result.imageResult?.verdict ?? 'REAL',
      active: { text: false, image: true, social: false },
      is_placeholder: false,
    }] : []),
    ...(socialScr !== null ? [{
      variant: 'social_only',
      prob_fake: socialScr / 100,
      prob_real: 1 - socialScr / 100,
      verdict: result.mediaResult?.verdict ?? 'REAL',
      active: { text: false, image: false, social: true },
      is_placeholder: false,
    }] : []),
    ...(textScr !== null && imageScr !== null ? [{
      variant: 'text_image',
      prob_fake: avg(textScr, imageScr) / 100,
      prob_real: 1 - avg(textScr, imageScr) / 100,
      verdict: avg(textScr, imageScr) >= 50 ? 'FAKE' : 'REAL',
      active: { text: true, image: true, social: false },
      is_placeholder: false,
    }] : []),
    ...(textScr !== null && socialScr !== null ? [{
      variant: 'text_social',
      prob_fake: avg(textScr, socialScr) / 100,
      prob_real: 1 - avg(textScr, socialScr) / 100,
      verdict: avg(textScr, socialScr) >= 50 ? 'FAKE' : 'REAL',
      active: { text: true, image: false, social: true },
      is_placeholder: false,
    }] : []),
    ...(textScr !== null && imageScr !== null && socialScr !== null ? [{
      variant: 'full_multimodal',
      prob_fake: avg(textScr, imageScr, socialScr) / 100,
      prob_real: 1 - avg(textScr, imageScr, socialScr) / 100,
      verdict: avg(textScr, imageScr, socialScr) >= 50 ? 'FAKE' : 'REAL',
      active: { text: true, image: true, social: true },
      is_placeholder: false,
    }] : []),
  ];

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
        <VerdictCard verdict={result.verdict} />
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

      {/* Modality bars */}
      <ModalityBars {...modalityScores} />

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
