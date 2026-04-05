'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { VERDICT_CONFIG } from '@/lib/constants';
import type { Verdict } from '@/lib/types';

interface VerdictCardProps {
  verdict: Verdict;
  confidence: number;
  platform: string;
  timestamp: string;
}

export function VerdictCard({ verdict, confidence, platform, timestamp }: VerdictCardProps) {

  console.log(verdict)
  const config = VERDICT_CONFIG[verdict];
  const shouldReduceMotion = useReducedMotion();

  const displayTs = new Date(timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

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
        style={{ background: `linear-gradient(135deg, ${config.bg} 0%, transparent 60%)` }}
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

          {/* Right: large confidence score */}
          <div className="text-right">
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Confidence
            </p>
            <motion.p
              className="font-mono-num font-semibold leading-none"
              style={{ fontSize: 48, color: config.color }}
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {confidence.toFixed(1)}
              <span className="text-2xl text-muted-foreground/60">%</span>
            </motion.p>
          </div>
        </div>

        {/* Bottom chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            MC Dropout · 50 samples
          </span>
          <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] text-muted-foreground font-mono-num capitalize">
            {platform}
          </span>
          <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] text-muted-foreground font-mono-num">
            {displayTs}
          </span>
          <span className="ml-auto rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground/60">
            Research prototype
          </span>
        </div>
      </div>
    </motion.div>
  );
}
