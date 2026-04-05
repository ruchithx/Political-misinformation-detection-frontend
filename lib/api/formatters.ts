import type { AnalyzeRequest, AnalysisResult } from '@/lib/types';

/** Convert a File to base64 string */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Build the POST body for the analysis endpoint */
export function buildAnalyzeRequest(
  text: string,
  platform: AnalyzeRequest['platform'],
  imageBase64?: string,
): AnalyzeRequest {
  return { text, platform, ...(imageBase64 ? { imageBase64 } : {}) };
}

/** Format a confidence number as a display string */
export function formatConfidence(value: number): string {
  return value.toFixed(1);
}

/** Map a 0–1 score to 0–100 for display */
export function toPercent(score: number): number {
  return Math.round(score * 100);
}
