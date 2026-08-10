'use client';

import { InputForm } from '@/components/analysis/InputForm';
import { useRouter } from 'next/navigation';
import { useHistory } from '@/hooks/useHistory';
import { useAnalysis } from '@/hooks/useAnalysis';
import { buildMediaFeatures, fetchUrlMetadata } from '@/lib/api/formatters';

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
        onSubmit={async (text, platform, imageFile, postUrl) => {
          let socialData = buildMediaFeatures(text, platform, postUrl);
          if (postUrl) {
            const scraped = await fetchUrlMetadata(postUrl, text);
            if (scraped) socialData = { ...socialData, ...scraped };
          }
          mutate({
            text,
            platform,
            imageFile,
            postUrl,
            socialData,
          });
        }}
      />
    </section>
  );
}
