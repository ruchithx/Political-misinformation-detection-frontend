'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Verdict, Platform } from '@/lib/types';
import { VERDICT_CONFIG, PLATFORM_CONFIG } from '@/lib/constants';

interface HistoryFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedVerdict: Verdict | null;
  onVerdictChange: (v: Verdict | null) => void;
  selectedPlatform: Platform | null;
  onPlatformChange: (p: Platform | null) => void;
  sort: 'newest' | 'oldest';
  onSortChange: (s: 'newest' | 'oldest') => void;
}

const VERDICTS: Verdict[] = ['MISINFORMATION', 'CREDIBLE', 'UNCERTAIN'];
const PLATFORMS: Platform[] = ['twitter', 'reddit', 'facebook'];

export function HistoryFilters({
  search, onSearchChange,
  selectedVerdict, onVerdictChange,
  selectedPlatform, onPlatformChange,
  sort, onSortChange,
}: HistoryFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search post content…"
          className="w-full rounded-xl border border-border bg-card pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#3B6FD4] focus:outline-none focus:ring-1 focus:ring-[#3B6FD4]/30 transition-colors font-mono-num"
          aria-label="Search history"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter pills row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Verdict pills */}
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Verdict:
        </span>
        {VERDICTS.map((v) => {
          const cfg = VERDICT_CONFIG[v];
          const active = selectedVerdict === v;
          return (
            <button
              key={v}
              onClick={() => onVerdictChange(active ? null : v)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-all',
                active
                  ? 'text-white'
                  : 'border border-border text-muted-foreground hover:border-current',
              )}
              style={active ? { backgroundColor: cfg.color } : { '--hover-color': cfg.color } as React.CSSProperties}
            >
              {v}
            </button>
          );
        })}

        <div className="h-4 w-px bg-border mx-1" />

        {/* Platform pills */}
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Platform:
        </span>
        {PLATFORMS.map((p) => {
          const cfg = PLATFORM_CONFIG[p];
          const active = selectedPlatform === p;
          return (
            <button
              key={p}
              onClick={() => onPlatformChange(active ? null : p)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-medium transition-all capitalize',
                active
                  ? 'border-[#3B6FD4] bg-[#3B6FD4]/10 text-[#3B6FD4]'
                  : 'border-border text-muted-foreground hover:border-[#3B6FD4]/50',
              )}
            >
              {cfg.label}
            </button>
          );
        })}

        <div className="ml-auto">
          <button
            onClick={() => onSortChange(sort === 'newest' ? 'oldest' : 'newest')}
            className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors font-mono-num"
          >
            {sort === 'newest' ? '↓ Newest first' : '↑ Oldest first'}
          </button>
        </div>
      </div>
    </div>
  );
}
