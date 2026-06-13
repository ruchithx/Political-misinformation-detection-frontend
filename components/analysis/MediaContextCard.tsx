'use client';

import { motion } from 'framer-motion';
import type { MediaContextResult } from '@/lib/types';

interface MediaContextCardProps {
  result: MediaContextResult;
}

// Human-readable labels for the raw feature names the backend returns
const FEATURE_LABELS: Record<string, string> = {
  domain_credibility_score: 'Domain Credibility',
  media_richness_score:     'Media Richness',
  metadata_completeness:    'Metadata Completeness',
  author_follow_count:      'Author Follow Count',
  verified:                 'Verified Account',
  platform:                 'Platform',
};

function label(key: string) {
  return FEATURE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MediaContextCard({ result }: MediaContextCardProps) {
  const { verdict, prob_fake, prob_real, confidence, attention } = result;

  // Sort attention entries descending by weight
  const attentionEntries = Object.entries(attention ?? {})
    .map(([k, v]) => ({ key: k, weight: v }))
    .sort((a, b) => b.weight - a.weight);

  const maxWeight = attentionEntries[0]?.weight ?? 1;

  const verdictColor = verdict === 'FAKE' ? '#C0392B' : '#1A7A4A';
  const verdictBg    = verdict === 'FAKE' ? '#FEF0F0' : '#F0FAF4';
  const verdictLabel = verdict === 'FAKE' ? 'MISINFORMATION' : 'CREDIBLE';

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Media Context Prediction
        </h3>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
          style={{ color: verdictColor, background: verdictBg }}
        >
          {verdictLabel}
        </span>
      </div>

      {/* Confidence row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/40 p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            Prob. Misinformation
          </p>
          <p
            className="font-mono-num text-xl font-bold"
            style={{ color: '#C0392B' }}
          >
            {(prob_fake * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            Prob. Credible
          </p>
          <p
            className="font-mono-num text-xl font-bold"
            style={{ color: '#1A7A4A' }}
          >
            {(prob_real * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Feature attention weights */}
      {attentionEntries.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Feature Attention Weights
          </p>
          <div className="space-y-2.5">
            {attentionEntries.map(({ key, weight }, i) => {
              const pct = (weight / maxWeight) * 100;
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-foreground">{label(key)}</span>
                    <span
                      className="font-mono-num text-[11px] font-semibold"
                      style={{ color: '#8B5CF6' }}
                    >
                      {(weight * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: '#8B5CF6' }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        type: 'spring',
                        stiffness: 80,
                        damping: 18,
                        delay: i * 0.06,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
