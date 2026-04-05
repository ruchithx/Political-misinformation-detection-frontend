'use client';

import { HistoryList } from "@/components/history/HistoryList";
import { useHistory } from "@/hooks/useHistory";

export default function HistoryPage() {
  const { history } = useHistory();

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Past Analyses</h1>
      <HistoryList results={history} />
    </section>
  );
}
