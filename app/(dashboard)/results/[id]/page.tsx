'use client';

import { ResultPanel } from "@/components/analysis/ResultPanel";
import { useHistory } from "@/hooks/useHistory";
import { useEffect, useState, use } from "react";
import type { AnalysisResult } from "@/lib/types";

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default function ResultPage(props: ResultPageProps) {
  const params = use(props.params);
  const { getById } = useHistory();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const res = getById(params.id);
    if (res) setResult(res);
  }, [params.id, getById]);

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Result Detail</h1>
      <ResultPanel result={result} />
    </section>
  );
}
