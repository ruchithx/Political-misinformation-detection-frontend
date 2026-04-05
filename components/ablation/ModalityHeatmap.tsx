'use client';

import type { AblationCondition } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ModalityHeatmapProps {
  data: AblationCondition[];
}

const METRICS = ['accuracy', 'precision', 'recall', 'f1'] as const;
const METRIC_LABELS: Record<typeof METRICS[number], string> = {
  accuracy:  'Accuracy',
  precision: 'Precision',
  recall:    'Recall',
  f1:        'F1 Score',
};

function valueToIntensity(value: number): string {
  // value is 0–1
  if (value >= 0.85) return 'bg-[#1A7A4A]/70 text-white';
  if (value >= 0.78) return 'bg-[#1A7A4A]/40 text-emerald-900 dark:text-emerald-200';
  if (value >= 0.70) return 'bg-[#B8720A]/30 text-amber-900 dark:text-amber-200';
  return 'bg-[#C0392B]/20 text-red-900 dark:text-red-200';
}

export function ModalityHeatmap({ data }: ModalityHeatmapProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h4
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Modality Contribution Heatmap
        </h4>
        <p className="text-xs text-muted-foreground">
          Color intensity indicates metric value (green = high, red = low)
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Condition
            </th>
            {METRICS.map((m) => (
              <th
                key={m}
                className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {METRIC_LABELS[m]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.label} className="border-b border-border/40 last:border-0">
              <td className="px-5 py-3 text-xs font-medium text-foreground">
                {row.isWinner ? <span className="text-[#F59E0B]">★ {row.label}</span> : row.label}
              </td>
              {METRICS.map((metric) => {
                const val = row[metric] ?? 0;
                return (
                  <td key={metric} className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-block rounded-md px-2.5 py-1 font-mono-num text-xs font-semibold',
                        valueToIntensity(val),
                      )}
                    >
                      {(val * 100).toFixed(1)}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
