'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

interface ConfidenceGaugeProps {
  value: number; // 0–100
}

const GAUGE_WIDTH = 300;
const GAUGE_HEIGHT = 16;

export function ConfidenceGauge({ value }: ConfidenceGaugeProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: shouldReduceMotion ? 300 : 60,
    damping: shouldReduceMotion ? 30 : 20,
  });
  const needleRef = useRef<SVGGElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on('change', (v) => {
      if (needleRef.current) {
        const x = (v / 100) * GAUGE_WIDTH;
        needleRef.current.setAttribute('transform', `translate(${x}, 0)`);
      }
    });
  }, [springValue]);

  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Confidence Meter
        </h3>
        <span className="font-mono-num text-sm font-semibold text-foreground">
          {value.toFixed(1)}%
        </span>
      </div>

      {/* SVG gauge */}
      <svg
        width="100%"
        viewBox={`0 0 ${GAUGE_WIDTH} 48`}
        className="overflow-visible"
        aria-label={`Confidence: ${value.toFixed(1)}%`}
      >
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1A7A4A" />
            <stop offset="50%"  stopColor="#B8720A" />
            <stop offset="100%" stopColor="#C0392B" />
          </linearGradient>
        </defs>

        {/* Track */}
        <rect
          x={0} y={16}
          width={GAUGE_WIDTH}
          height={GAUGE_HEIGHT}
          rx={GAUGE_HEIGHT / 2}
          fill="url(#gauge-gradient)"
          opacity={0.25}
        />
        {/* Fill */}
        <motion.rect
          x={0} y={16}
          width={0}
          height={GAUGE_HEIGHT}
          rx={GAUGE_HEIGHT / 2}
          fill="url(#gauge-gradient)"
          animate={{ width: GAUGE_WIDTH * (value / 100) }}
          transition={{
            type: 'spring',
            stiffness: shouldReduceMotion ? 300 : 60,
            damping: shouldReduceMotion ? 30 : 20,
          }}
        />

        {/* Needle */}
        <g ref={needleRef} transform={`translate(0, 0)`}>
          <rect
            x={-1} y={10}
            width={2}
            height={GAUGE_HEIGHT + 8}
            rx={1}
            fill="white"
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
          />
          <circle cx={0} cy={24} r={4} fill="white" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.4))" />
        </g>

        {/* Tick labels */}
        {ticks.map((t) => (
          <text
            key={t}
            x={GAUGE_WIDTH * (t / 100)}
            y={46}
            textAnchor="middle"
            fontSize={9}
            fill="currentColor"
            className="fill-muted-foreground font-mono-num"
          >
            {t}
          </text>
        ))}
      </svg>

      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Credible</span>
        <span>Uncertain</span>
        <span>Misinformation</span>
      </div>
    </div>
  );
}
