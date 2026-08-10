'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { VERDICT_CONFIG } from '@/lib/constants';
import type { Verdict } from '@/lib/types';

interface VerdictCardProps {
  verdict: Verdict;
}

export function VerdictCard({ verdict }: VerdictCardProps) {
  console.log(verdict);
  const config = VERDICT_CONFIG[verdict];
  console.log('🚀 ~ VerdictCard ~ config:', config);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-xl border bg-card"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: config.color,
        borderColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
      }}
    >
      {/* Subtle bg tint */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-10"
        style={{
          background: `linear-gradient(135deg, ${config.bg} 0%, transparent 60%)`,
        }}
      />

      <div className="relative px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: verdict text + score */}
          <div>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Final Verdict
            </p>
            <motion.p
              className="text-2xl font-bold tracking-tight"
              style={{ color: config.color, fontFamily: 'var(--font-heading)' }}
              initial={shouldReduceMotion ? {} : { x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {config.label}
            </motion.p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
