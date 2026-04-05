'use client';

import { LOCALSTORAGE_KEY } from '@/lib/constants';

import type { AnalysisResult } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';

function loadHistory(): AnalysisResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (raw) return JSON.parse(raw) as AnalysisResult[];
    return [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addResult = useCallback((result: AnalysisResult) => {
    setHistory((prev) => {
      const next = [result, ...prev];
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getById = useCallback(
    (id: string) => history.find((r) => r.id === id),
    [history],
  );

  const clearHistory = useCallback(() => {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addResult, getById, clearHistory };
}
