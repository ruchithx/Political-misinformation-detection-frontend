'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { VERDICT_CONFIG, PLATFORM_CONFIG } from '@/lib/constants';
import type { AnalysisResult } from '@/lib/types';

interface HistoryItemProps {
  result: AnalysisResult;
  index: number;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

export function HistoryItem({ result, index }: HistoryItemProps) {
  const verdictCfg = VERDICT_CONFIG[result.verdict];
  const platformCfg = PLATFORM_CONFIG[result.platform];
  const snippet = result.inputText.length > 140
    ? result.inputText.slice(0, 140) + '…'
    : result.inputText;

  const displayTs = new Date(result.timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      className="group rounded-xl border bg-card px-5 py-4 transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: 3, borderLeftColor: verdictCfg.color }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* Verdict badge */}
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: verdictCfg.bg, color: verdictCfg.color }}
            >
              {verdictCfg.label}
            </span>
            {/* Platform */}
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground capitalize">
              {platformCfg.label}
            </span>
            {/* Timestamp */}
            <span className="font-mono-num text-[11px] text-muted-foreground">{displayTs}</span>
          </div>

          {/* Text snippet */}
          <p className="text-sm text-muted-foreground leading-relaxed">{snippet}</p>

          {/* Research prototype label */}
          <p className="mt-2 text-[10px] text-muted-foreground/50">Research prototype</p>
        </div>

        {/* View button */}
        <Link
          href={`/ablation/${result.id}`}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:border-[#3B6FD4] hover:text-[#3B6FD4]"
          aria-label={`View result ${result.id}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View
        </Link>
      </div>
    </motion.div>
  );
}
