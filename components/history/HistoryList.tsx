'use client';

import { motion } from 'framer-motion';
import { HistoryItem } from './HistoryItem';
import type { AnalysisResult } from '@/lib/types';

interface HistoryListProps {
  results: AnalysisResult[];
}

export function HistoryList({ results }: HistoryListProps) {
  if (results.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <svg className="h-6 w-6 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted-foreground">No results found</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Adjust filters or run an analysis to see results here
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-3"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } },
        hidden: {},
      }}
    >
      {results.map((r, i) => (
        <HistoryItem key={r.id} result={r} index={i} />
      ))}
    </motion.div>
  );
}
