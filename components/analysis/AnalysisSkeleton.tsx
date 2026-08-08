'use client';

import { useReducedMotion } from 'framer-motion';

export function AnalysisSkeleton() {
  const shouldReduceMotion = useReducedMotion();
  const pulse = shouldReduceMotion === true ? '' : 'animate-pulse';

  return (
    <div className="space-y-4">

      {/* Skeleton 1: VerdictCard shape */}
      <div
        className={`rounded-xl border bg-card p-6 ${pulse}`}
        style={{ borderLeftWidth: 4, borderLeftColor: 'var(--color-mod-text)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-6 w-36 rounded bg-muted" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-3 w-20 rounded bg-muted ml-auto" />
            <div className="h-12 w-24 rounded bg-muted ml-auto" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-5 w-24 rounded bg-muted ml-auto" />
        </div>
      </div>

      {/* Skeleton 2: Model Breakdown — heading + 3-column card grid */}
      <div className={`space-y-3 ${pulse}`}>
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-4 space-y-2"
              style={{ borderTopWidth: 3, borderTopColor: 'var(--color-muted)' }}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-muted" />
                <div className="h-2.5 w-16 rounded bg-muted" />
              </div>
              <div className="h-8 w-20 rounded bg-muted" />
              <div className="h-2.5 w-full rounded bg-muted" />
              <div className="h-5 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton 3: ModalityBars shape */}
      <div className={`rounded-xl border bg-card p-5 space-y-4 ${pulse}`}>
        <div className="h-4 w-32 rounded bg-muted" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 w-10 rounded bg-muted" />
            </div>
            <div className="h-2 w-full rounded-full bg-muted" />
          </div>
        ))}
      </div>

      {/* Skeleton 4: Generic card (Confidence Gauge / MediaContextCard slot) */}
      <div className={`rounded-xl border bg-card p-5 space-y-3 ${pulse}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="h-4 w-12 rounded bg-muted" />
        </div>
        <div className="h-8 w-full rounded-lg bg-muted" />
        <div className="flex justify-between">
          <div className="h-2.5 w-16 rounded bg-muted" />
          <div className="h-2.5 w-16 rounded bg-muted" />
          <div className="h-2.5 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
