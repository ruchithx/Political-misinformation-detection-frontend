'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MODALITY_CONFIG } from '@/lib/constants';
import type { ModalityKey } from '@/lib/types';

interface ModalityBarsProps {
  textScore?: number | null;
  imageScore?: number | null;
  socialScore?: number | null;
  fusionScore?: number | null;
}

type BarItem = { key: ModalityKey; score: number };

export function ModalityBars({
  textScore,
  imageScore,
  socialScore,
  fusionScore,
}: ModalityBarsProps) {
  const shouldReduceMotion = useReducedMotion();
  console.log(textScore, imageScore, socialScore, fusionScore);

  const bars: BarItem[] = [
    { key: 'text' as ModalityKey, score: textScore },
    { key: 'image' as ModalityKey, score: imageScore },
    { key: 'social' as ModalityKey, score: socialScore },
    { key: 'fusion' as ModalityKey, score: fusionScore },
  ].filter((bar): bar is BarItem => bar.score != null);

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3
        className="mb-4 text-sm font-semibold text-foreground"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Modality Scores
      </h3>
      <div className="space-y-4">
        {bars.map(({ key, score }, i) => {
          const cfg = MODALITY_CONFIG[key];
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  {cfg.label}
                </span>
                <span
                  className="font-mono-num text-sm font-semibold"
                  style={{ color: cfg.color }}
                >
                  {score.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cfg.color }}
                  initial={{ width: shouldReduceMotion ? `${score}%` : '0%' }}
                  animate={{ width: `${score}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 80,
                    damping: 18,
                    delay: shouldReduceMotion ? 0 : i * 0.1,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
