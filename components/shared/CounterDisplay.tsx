'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useReducedMotion, motion } from 'framer-motion';

interface CounterDisplayProps {
  value: number;
  className?: string;
}

export function CounterDisplay({ value, className }: CounterDisplayProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: shouldReduceMotion ? 500 : 100,
    damping: shouldReduceMotion ? 50 : 25,
  });
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return spring.on('change', (v) => {
      if (displayRef.current) {
        displayRef.current.textContent = Math.round(v).toLocaleString();
      }
    });
  }, [spring]);

  return (
    <span ref={displayRef} className={className}>
      {value.toLocaleString()}
    </span>
  );
}
