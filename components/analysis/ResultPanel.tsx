'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { VerdictCard } from './VerdictCard';
import { ModalityBars } from './ModalityBars';
import { ConfidenceGauge } from './ConfidenceGauge';
import { SentenceHighlighter } from './SentenceHighlighter';
import { TopTokensCard } from './TopTokensCard';
import { FeatureMetricsCard } from './FeatureMetricsCard';
import type { AnalysisResult } from '@/lib/types';

interface ResultPanelProps {
  result: AnalysisResult | null;
}

export function ResultPanel({ result }: ResultPanelProps) {
  console.log("🚀 ~ ResultPanel ~ result:", result)
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {result && (
        <motion.div
          key={result.id}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          <VerdictCard
            verdict={result.verdict}
            confidence={result.confidence}
            platform={result.platform}
            timestamp={result.timestamp}
          />
          {/* Display legacy components if they exist (e.g. from MOCK_RESULT) */}
          {(result.textScore !== undefined && result.imageScore !== undefined) && (
            <ModalityBars
              textScore={result.textScore}
              imageScore={result.imageScore}
              socialScore={result.socialScore}
              fusionScore={result.fusionScore}
            />
          )}

          {/* New backend features */}
          {result.top_tokens && result.top_tokens.length > 0 && (
            <TopTokensCard tokens={result.top_tokens} />
          )}

          {result.features && (
            <FeatureMetricsCard features={result.features} />
          )}

          <ConfidenceGauge value={result.confidence} />

          {result.sentences && result.sentences.length > 0 && (
            <SentenceHighlighter sentences={result.sentences} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
