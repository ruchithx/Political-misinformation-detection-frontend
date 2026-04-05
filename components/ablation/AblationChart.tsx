'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { AblationCondition } from '@/lib/types';

interface AblationChartProps {
  data: AblationCondition[];
}

const METRIC_COLORS = {
  prob_fake: '#E11D48', // redish color for fake probability
};

const formatVariantName = (variant: string) => {
  switch (variant) {
    case 'text_only': return 'Text Only';
    case 'image_only': return 'Image Only';
    case 'social_only': return 'Social Only';
    case 'text_image': return 'Text + Image';
    case 'text_social': return 'Text + Social';
    case 'full_multimodal': return 'Full Model';
    default: return variant;
  }
};

export function AblationChart({ data }: AblationChartProps) {
  const chartData = data.map((d) => ({
    name: formatVariantName(d.variant),
    'Fake Probability': parseFloat((d.prob_fake * 100).toFixed(1)),
    is_placeholder: d.is_placeholder,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: '#1E2130',
            border: '1px solid #3D4259',
            borderRadius: 10,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
          itemStyle={{ color: '#F4F5F8' }}
          formatter={(v) => [`${v}%`]}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{value}</span>
          )}
        />
        <Bar 
          dataKey="Fake Probability"  
          fill={METRIC_COLORS.prob_fake}  
          radius={[3, 3, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
