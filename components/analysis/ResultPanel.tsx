'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { VerdictCard } from './VerdictCard';
import { ModalityBars } from './ModalityBars';
import { SentenceHighlighter } from './SentenceHighlighter';
import { FeatureMetricsCard } from './FeatureMetricsCard';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AnalysisResult, ClaimScore } from '@/lib/types';

interface ResultPanelProps {
  result: AnalysisResult | null;
}

const MODEL_VERDICT_COLOR: Record<string, string> = {
  FAKE: '#C0392B',
  REAL: '#1A7A4A',
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function PerClaimBreakdown({ claims }: { claims: ClaimScore[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <span>Per-Claim Analysis</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <ul className="divide-y divide-border/30 px-4 pb-3 pt-1 space-y-0">
          {claims.map((c, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-2">
              <span className="text-xs text-foreground/80 leading-relaxed flex-1">{c.claim_text}</span>
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap pt-0.5">
                {(c.prob_fake * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <p className="px-4 pb-2.5 text-[10px] text-muted-foreground/60 italic">
          Advisory only — scores individual claims; does not affect the verdict above.
        </p>
      )}
    </div>
  );
}

export function ResultPanel({ result }: ResultPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {result && (
        <motion.div
          key={result.id}
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
          animate={shouldReduceMotion ? { opacity: 1 } : 'show'}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {/* Overall verdict */}
          <motion.div variants={shouldReduceMotion ? undefined : itemVariants}>
            <VerdictCard verdict={result.verdict} />
          </motion.div>

          {/* Per-model result cards */}
          {(result.textResult || result.imageResult || result.mediaResult) && (
            <motion.div variants={shouldReduceMotion ? undefined : itemVariants} className="space-y-3">
              <h3
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Model Breakdown
              </h3>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                {result.textResult && (
                  <ModelScoreCard
                    label="Text Model"
                    color="#3B6FD4"
                    probFake={result.textResult.prob_fake}
                    verdict={result.textResult.verdict}
                    detail={`Uncertainty: ${(result.textResult.uncertainty * 100).toFixed(1)}%`}
                  />
                )}
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

              {result.textResult?.segmentation?.claims &&
                result.textResult.segmentation.claims.length > 1 && (
                  <PerClaimBreakdown claims={result.textResult.segmentation.claims} />
              )}
            </motion.div>
          )}

          {/* Modality bars */}
          {(result.textScore != null ||
            result.imageScore != null ||
            result.socialScore != null) && (
            <motion.div variants={shouldReduceMotion ? undefined : itemVariants}>
              <ModalityBars
                textScore={result.textScore}
                imageScore={result.imageScore}
                socialScore={result.socialScore}
                fusionScore={result.fusionScore}
              />
            </motion.div>
          )}


          {result.features && (
            <motion.div variants={shouldReduceMotion ? undefined : itemVariants}>
              <FeatureMetricsCard features={result.features} />
            </motion.div>
          )}

          {result.sentences && result.sentences.length > 0 && (
            <motion.div variants={shouldReduceMotion ? undefined : itemVariants}>
              <SentenceHighlighter sentences={result.sentences} />
            </motion.div>
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
