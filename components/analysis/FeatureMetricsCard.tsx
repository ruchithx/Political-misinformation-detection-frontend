'use client';

import { motion } from 'framer-motion';

interface FeatureMetricsCardProps {
  features?: {
    ner?: Record<string, number>;
    numeric?: Record<string, number>;
    emotion?: Record<string, number>;
    claim_count?: number;
  };
}

export function FeatureMetricsCard({ features }: FeatureMetricsCardProps) {
  if (!features) return null;

  const emotionValues = features.emotion || {};
  const nerValues = features.ner || {};
  
  // Format emotion features
  const showEmotion = Object.keys(emotionValues).length > 0;
  
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Emotion & Tone Analysis */}
      {showEmotion && (
        <div className="rounded-xl border bg-card p-5">
          <h3
            className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs">
              🎭
            </span>
            Emotion & Tone
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Fear Factor', key: 'fear_score', color: '#B8720A' },
              { label: 'Anger Level', key: 'anger_score', color: '#C0392B' },
              { label: 'Urgency', key: 'urgency_score', color: '#D35400' },
              { label: 'Sarcasm', key: 'sarcasm_score', color: '#8E44AD' },
            ].map(({ label, key, color }) => {
              const val = emotionValues[key] || 0;
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{label}</span>
                    <span className="font-mono-num font-semibold">{(val * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(val * 100, 100)}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Linguistic & Context Features */}
      <div className="rounded-xl border bg-card p-5 flex flex-col">
        <h3
          className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs">
            📊
          </span>
          Linguistic Indicators
        </h3>
        
        <div className="flex-1 space-y-3 relative">
           <div className="grid grid-cols-2 gap-3 text-sm">
             <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Claims Detected</p>
                <p className="text-xl font-bold font-mono-num">{features.claim_count || 0}</p>
             </div>
             
             <div className="rounded-lg border bg-muted/30 p-3">
               <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Adj/Adv Ratio</p>
               <p className="text-xl font-bold font-mono-num">
                  {nerValues['adj_adv_ratio'] !== undefined ? nerValues['adj_adv_ratio'].toFixed(2) : '0.00'}
               </p>
             </div>
             
             <div className="col-span-2 rounded-lg border bg-muted/30 p-3 flex justify-between items-center">
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Named Entities (People, Orgs)</p>
               <p className="text-lg font-bold font-mono-num text-foreground">
                 { (nerValues['has_person'] || 0) + (nerValues['has_org'] || 0) + (nerValues['has_gpe'] || 0) }
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
