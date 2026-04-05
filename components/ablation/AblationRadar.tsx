'use client';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import type { AblationCondition } from '@/lib/types';

interface AblationRadarProps {
  data: AblationCondition;
}

export function AblationRadar({ data }: AblationRadarProps) {
  const radarData = [
    { metric: 'Accuracy',  value: parseFloat(((data.accuracy ?? 0)  * 100).toFixed(1)) },
    { metric: 'Precision', value: parseFloat(((data.precision ?? 0) * 100).toFixed(1)) },
    { metric: 'Recall',    value: parseFloat(((data.recall ?? 0)    * 100).toFixed(1)) },
    { metric: 'F1 Score',  value: parseFloat(((data.f1 ?? 0)        * 100).toFixed(1)) },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart outerRadius={90} data={radarData}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[50, 100]}
          tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
          tickFormatter={(v) => `${v}`}
        />
        <Radar
          name={data.label}
          dataKey="value"
          stroke="#F59E0B"
          fill="#F59E0B"
          fillOpacity={0.2}
        />
        <Tooltip
          contentStyle={{
            background: '#1E2130',
            border: '1px solid #3D4259',
            borderRadius: 8,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}
          formatter={(v) => [`${v}%`]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
