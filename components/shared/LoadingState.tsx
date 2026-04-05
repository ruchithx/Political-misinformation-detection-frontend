import { LoadingDots } from '@/components/analysis/LoadingDots';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <LoadingDots />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
