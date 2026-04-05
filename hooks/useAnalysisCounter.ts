'use client';

import { LOCALSTORAGE_KEY } from '@/lib/constants';
import { useEffect, useState } from 'react';

const COUNTER_KEY = 'truthlens_analysis_count';

export function useAnalysisCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw) setCount(parseInt(raw, 10));
    else {
      // seed from history length
      try {
        const hist = localStorage.getItem(LOCALSTORAGE_KEY);
        if (hist) {
          const len = (JSON.parse(hist) as unknown[]).length;
          setCount(len);
          localStorage.setItem(COUNTER_KEY, String(len));
        }
      } catch {}
    }
  }, []);

  const increment = () => {
    setCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(COUNTER_KEY, String(next));
      return next;
    });
  };

  return { count, increment };
}
