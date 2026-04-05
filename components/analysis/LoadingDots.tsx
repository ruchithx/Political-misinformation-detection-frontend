'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function LoadingDots() {
  const shouldReduceMotion = useReducedMotion();

  const dots = [
    { color: '#3B6FD4', label: 'Text' },
    { color: '#8B5CF6', label: 'Image' },
    { color: '#0D9488', label: 'Social' },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="flex items-center gap-3">
        {dots.map((dot, i) => (
          <motion.span
            key={dot.label}
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: dot.color }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }
            }
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
            aria-label={`${dot.label} analysis running`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground font-mono-num">
        Running multimodal analysis…
      </p>
    </div>
  );
}
