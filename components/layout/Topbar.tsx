'use client';

import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAnalysisCounter } from '@/hooks/useAnalysisCounter';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/':          'Analyze',
  '/history':   'Analysis History',
  '/ablation':  'Ablation Study',
};

function StatusDot({ status = 'up' }: { status?: 'up' | 'degraded' | 'down' }) {
  const colors = { up: '#1A7A4A', degraded: '#B8720A', down: '#C0392B' };
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="relative flex h-2 w-2"
        title={`Backend ${status}`}
        aria-label={`Backend status: ${status}`}
      >
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ backgroundColor: colors[status] }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: colors[status] }}
        />
      </span>
      <span className="hidden text-[11px] text-muted-foreground sm:inline font-mono-num">
        {status === 'up' ? 'Backend online' : status === 'degraded' ? 'Degraded' : 'Offline'}
      </span>
    </span>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const { count } = useAnalysisCounter();
  const shouldReduceMotion = useReducedMotion();

  // resolve title incl. dynamic routes
  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith('/ablation/') ? 'Ablation Study' : 'TruthLens');

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      {/* Page title */}
      <h1
        className="text-[15px] font-semibold tracking-tight text-foreground"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </h1>

      {/* Right cluster */}
      <div className="flex items-center gap-5">
        {/* Analysis counter */}
        <motion.div
          key={count}
          initial={shouldReduceMotion ? {} : { opacity: 0.6, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5"
        >
          <span className="font-mono-num text-sm font-semibold text-foreground">
            {count.toLocaleString()}
          </span>
          <span className="text-[12px] text-muted-foreground">analyses run</span>
        </motion.div>

        <div className="h-4 w-px bg-border" />

        {/* Status dot */}
        <StatusDot status="up" />
      </div>
    </header>
  );
}
