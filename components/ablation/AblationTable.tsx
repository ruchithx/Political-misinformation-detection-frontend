'use client';

import type { AblationCondition } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AblationTableProps {
  data: AblationCondition[];
}

const HEADERS = ['Condition', 'Accuracy', 'Precision', 'Recall', 'F1'];

export function AblationTable({ data }: AblationTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.label}
              className={cn(
                'border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30',
                row.isWinner && 'bg-[#F59E0B]/5',
              )}
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  {row.isWinner && (
                    <span className="text-[#F59E0B]" aria-label="Winner">★</span>
                  )}
                  <span
                    className={cn(
                      'font-medium',
                      row.isWinner ? 'text-[#F59E0B]' : 'text-foreground',
                    )}
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {row.label}
                  </span>
                </div>
              </td>
              {(['accuracy', 'precision', 'recall', 'f1'] as const).map((metric) => (
                <td
                  key={metric}
                  className={cn(
                    'px-5 py-3.5 font-mono-num text-sm',
                    row.isWinner ? 'font-semibold text-[#F59E0B]' : 'text-foreground',
                  )}
                >
                  {((row[metric] ?? 0) * 100).toFixed(1)}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
