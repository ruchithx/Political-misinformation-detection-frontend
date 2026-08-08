'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputForm } from '@/components/analysis/InputForm';
import { ResultPanel } from '@/components/analysis/ResultPanel';
import { AnalysisSkeleton } from '@/components/analysis/AnalysisSkeleton';
import { useHistory } from '@/hooks/useHistory';
import { useAnalysisCounter } from '@/hooks/useAnalysisCounter';
import type { AnalysisResult, Platform } from '@/lib/types';
import { useAnalysis } from '@/hooks/useAnalysis';
import { buildMediaFeatures } from '@/lib/api/formatters';

export default function DashboardPage() {
  const router = useRouter();
  const { addResult } = useHistory();
  const { increment } = useAnalysisCounter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isPending, setIsPending] = useState(false);

  const { mutateAsync: runAnalysis } = useAnalysis();

  const handleSubmit = async (
    text: string,
    platform: Platform,
    imageFile?: File | null,
    postUrl?: string,
  ) => {
    setIsPending(true);
    try {
      const socialData = buildMediaFeatures(text, platform, postUrl);
      console.log('[DashboardPage] Before mutation — socialData payload:', socialData);
      const analysisRes = await runAnalysis({
        text,
        platform,
        imageFile,
        postUrl,
        socialData,
      });

      setResult(analysisRes);
      addResult(analysisRes);
      increment();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left panel */}
      <div className="flex flex-col border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight mb-2">
            Analyze Content
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter a political statement, social media post, or claim to evaluate
            its credibility.
          </p>
        </div>
        <InputForm onSubmit={handleSubmit} isLoading={isPending} />
      </div>

      {/* Right panel */}
      <div className="bg-muted/10 p-6 overflow-y-auto relative min-h-[400px]">
        {isPending ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6">
            <AnalysisSkeleton />
          </div>
        ) : result ? (
          <div className="space-y-4 pb-20">
            <ResultPanel result={result} />
            <div className="flex justify-end pr-4">
              <button
                onClick={() => router.push(`/ablation/${result.id}`)}
                className="text-sm font-medium text-[#3B6FD4] hover:underline"
              >
                Ablation Study →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <svg
                className="h-6 w-6 text-muted-foreground/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No recent analysis
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60 max-w-[200px]">
              Submit content on the left to see reasoning and scores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}