'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { VerdictCard } from './VerdictCard';
import { ModalityBars } from './ModalityBars';
import { ConfidenceGauge } from './ConfidenceGauge';
import { SentenceHighlighter } from './SentenceHighlighter';
import { FeatureMetricsCard } from './FeatureMetricsCard';
import type { AnalysisResult } from '@/lib/types';

interface ResultPanelProps {
  result: AnalysisResult | null;
}

const MODEL_VERDICT_COLOR: Record<string, string> = {
  FAKE: '#C0392B',
  REAL: '#1A7A4A',
};

export function ResultPanel({ result }: ResultPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {result && (
        <motion.div
          key={result.id}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          {/* Overall verdict */}
          <VerdictCard
            verdict={result.verdict}
            confidence={result.confidence}
            platform={result.platform}
            timestamp={result.timestamp}
          />

          {/* Per-model result cards */}
          {(result.textResult || result.imageResult || result.mediaResult) && (
            <div className="space-y-3">
              <h3
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Model Breakdown
              </h3>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                {/* Text model */}
                {result.textResult && (
                  <ModelScoreCard
                    label="Text Model"
                    color="#3B6FD4"
                    probFake={result.textResult.prob_fake}
                    verdict={result.textResult.verdict}
                    detail={`Uncertainty: ${(result.textResult.uncertainty * 100).toFixed(1)}%`}
                  />
                )}

                {/* Image model */}
                {result.imageResult && (
                  <ModelScoreCard
                    label="Image Model"
                    color="#8B5CF6"
                    probFake={result.imageResult.prob_fake}
                    verdict={result.imageResult.verdict}
                    detail={`PCCS: ${(result.imageResult.pccs_score * 100).toFixed(1)}%`}
                    detailTooltip="Semantic alignment between image OCR text and caption"
                  />
                )}

                {/* Media context model */}
                {result.mediaResult && (
                  <ModelScoreCard
                    label="Media Context"
                    color="#0D9488"
                    probFake={result.mediaResult.prob_fake}
                    verdict={result.mediaResult.verdict}
                    detail={
                      result.mediaResult.top_signals?.[0]
                        ? `Top signal: ${result.mediaResult.top_signals[0].feature.replace(/_/g, ' ')}`
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Modality bars */}
          {(result.textScore != null ||
            result.imageScore != null ||
            result.socialScore != null) && (
            <ModalityBars
              textScore={result.textScore}
              imageScore={result.imageScore}
              socialScore={result.socialScore}
              fusionScore={result.fusionScore}
            />
          )}

          {/* Media context top signals */}
          {result.mediaResult?.top_signals && result.mediaResult.top_signals.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3
                className="mb-3 text-sm font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Media Context Signals
              </h3>
              <div className="space-y-2.5">
                {result.mediaResult.top_signals.map((sig) => (
                  <div key={sig.feature}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">
                        {sig.feature.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono-num text-[#0D9488] font-semibold">
                        {(sig.attention * 100).toFixed(1)}% attn
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#0D9488] transition-all duration-700"
                        style={{ width: `${sig.attention * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image PCCS alignment */}
          {result.imageResult?.pccs_score != null && (
            <div className="rounded-xl border bg-card p-5">
              <h3
                className="mb-3 text-sm font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Image Semantic Alignment (PCCS)
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  OCR text ↔ Caption alignment
                </span>
                <span className="font-mono-num text-sm font-semibold text-[#8B5CF6]">
                  {(result.imageResult.pccs_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#8B5CF6] transition-all duration-700"
                  style={{ width: `${result.imageResult.pccs_score * 100}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/60 leading-relaxed">
                Low alignment may indicate manipulated or misleading imagery.
              </p>
            </div>
          )}

          {/* Text model features */}
          {result.features && <FeatureMetricsCard features={result.features} />}

          <ConfidenceGauge value={result.confidence} />

          {result.sentences && result.sentences.length > 0 && (
            <SentenceHighlighter sentences={result.sentences} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Internal sub-component ────────────────────────────────────────────

function ModelScoreCard({
  label,
  color,
  probFake,
  verdict,
  detail,
  detailTooltip,
}: {
  label: string;
  color: string;
  probFake: number;
  verdict: string;
  detail?: string;
  detailTooltip?: string;
}) {
  const verdictColor = MODEL_VERDICT_COLOR[verdict] ?? color;

  return (
    <div
      className="rounded-xl border bg-card p-4"
      style={{ borderTopWidth: 3, borderTopColor: color }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <p
        className="font-mono-num text-3xl font-bold leading-none"
        style={{ color }}
      >
        {(probFake * 100).toFixed(1)}
        <span className="text-base text-muted-foreground/60">%</span>
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">Fake probability</p>
      <div
        className="mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
        style={{
          backgroundColor: `${verdictColor}15`,
          color: verdictColor,
        }}
      >
        {verdict}
      </div>
      {detail && (
        <p
          className="mt-2 text-[10px] text-muted-foreground/70 truncate"
          title={detailTooltip}
        >
          {detail}
        </p>
      )}
    </div>
  );
}
