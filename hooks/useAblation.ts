'use client';

import { useMutation } from '@tanstack/react-query';
import { ABLATION_DATA } from '@/lib/constants';
import type { AblationCondition } from '@/lib/types';

export function useAblation() {
  return useMutation<AblationCondition[], Error, string>({
    mutationFn: async (text) => {
      try {
        const res = await fetch('/api/ablation/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) {
          if (res.status === 503) {
            console.warn("Backend unavailable, falling back to mock ablation data...");
            await new Promise((r) => setTimeout(r, 1800));
            return ABLATION_DATA;
          }
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        console.log('Ablation backend response:', data);

        // Response shape: { text_normalized, variants: [...], latency_ms }
        const variants = data.variants;
        console.log('🚀 ~ useAblation ~ variants:', variants);

        if (Array.isArray(variants) && variants.length > 0) {
          return variants as AblationCondition[];
        }

        throw new Error(`Invalid format: ${JSON.stringify(data)}`);
      } catch (error) {
        console.error('Ablation error:', error);
        await new Promise((r) => setTimeout(r, 1800));
        return ABLATION_DATA;
      }
    },
  });
}
