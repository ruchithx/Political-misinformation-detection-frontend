'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { SentenceScore } from '@/lib/types';

interface SentenceHighlighterProps {
  sentences: SentenceScore[];
}

function scoreToColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 0.7)
    return { bg: '#FEF0F0', text: '#C0392B', border: '#C0392B30' };
  if (score >= 0.4)
    return { bg: '#FFF8ED', text: '#B8720A', border: '#B8720A30' };
  return { bg: 'transparent', text: 'inherit', border: 'transparent' };
}

function scoreToLabel(score: number): string {
  if (score >= 0.7) return 'High risk';
  if (score >= 0.4) return 'Moderate risk';
  return 'Low risk';
}

export function SentenceHighlighter({ sentences }: SentenceHighlighterProps) {
  console.log("🚀 ~ SentenceHighlighter ~ sentences:", sentences)
  
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3
        className="mb-3 text-sm font-semibold text-foreground"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Sentence Analysis
      </h3>
      <div className="space-y-1.5 leading-relaxed">
        {sentences.map((s, i) => {
          const colors = scoreToColor(s.score);
          const isHovered = hoveredIdx === i;
          return (
            <motion.span
              key={i}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : i * 0.03, duration: 0.2 }}
              className="relative inline cursor-pointer rounded px-1 py-0.5 text-sm transition-all"
              style={{
                backgroundColor: colors.bg,
                color: colors.text !== 'inherit' ? colors.text : undefined,
                border: `1px solid ${colors.border}`,
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {s.text}{' '}
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute bottom-full left-0 z-10 mb-1.5 min-w-[180px] rounded-lg border border-border bg-card px-3 py-2 shadow-xl"
                  style={{ color: 'var(--foreground)' }}
                >
                  <p className="font-mono-num text-xs font-semibold" style={{ color: colors.text !== 'inherit' ? colors.text : '#8A8FA8' }}>
                    {scoreToLabel(s.score)} · {(s.score * 100).toFixed(0)}%
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.signal}</p>
                </motion.span>
              )}
            </motion.span>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Hover over highlighted sentences to see detected signals
      </p>
    </div>
  );
}
