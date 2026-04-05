'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface TopTokensCardProps {
  tokens?: { token: string; weight: number }[];
}

export function TopTokensCard({ tokens }: TopTokensCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!tokens || tokens.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="text-sm font-semibold text-foreground flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs">
            🔍
          </span>
          Top Tokens (Attention)
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tokens.map((item, i) => {
          // Normalize weights for visualization (usually 0 - 1, making it a bit more visible)
          // Adjust opacity based on relative weight for a subtle heatmap effect
          const maxWeight = Math.max(...tokens.map(t => t.weight));
          const relativeWeight = item.weight / (maxWeight || 1);
          const bgOpacity = Math.max(0.1, relativeWeight * 0.4);

          return (
            <motion.div
              key={item.token + i}
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: shouldReduceMotion ? 0 : i * 0.05, duration: 0.2 }}
              className="group relative flex cursor-default select-none items-center rounded-lg border px-3 py-1.5 transition-colors hover:border-foreground/20"
              style={{
                backgroundColor: `rgba(192, 57, 43, ${bgOpacity})`,
                borderColor: `rgba(192, 57, 43, ${bgOpacity + 0.1})`,
              }}
            >
              <span className="font-mono text-sm font-medium text-foreground">
                {item.token}
              </span>
              <span className="ml-2 rounded-md bg-background/50 px-1.5 py-0.5 font-mono-num text-[10px] text-muted-foreground">
                {(item.weight * 100).toFixed(1)}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
