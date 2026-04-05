'use client';

import { InputForm } from '@/components/analysis/InputForm';
import { useRouter } from 'next/navigation';
import { useHistory } from '@/hooks/useHistory';
import { useAnalysis } from '@/hooks/useAnalysis';

export default function AnalyzePage() {
  const router = useRouter();
  const { addResult } = useHistory();

  const { mutate, isPending } = useAnalysis({
    onSuccess: (res) => {
      addResult(res);
      router.push(`/results/${res.id}`);
    },
  });

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Analyze Content</h1>
      <InputForm
        isLoading={isPending}
        onSubmit={(text, platform, imageFile) => {
          mutate({ text, platform, imageFile });
        }}
      />
    </section>
  );
}
