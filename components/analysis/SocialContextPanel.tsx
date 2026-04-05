'use client';

import {
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts';
import type { SocialContext } from '@/lib/types';

interface SocialContextPanelProps {
  socialContext: SocialContext;
}

export function SocialContextPanel({ socialContext }: SocialContextPanelProps) {
  const { propagationSpeed, replySentiment, engagementAnomaly } = socialContext;
  const anomalyPct = Math.round(engagementAnomaly * 100);
  const anomalyColor = engagementAnomaly > 0.7 ? '#C0392B' : engagementAnomaly > 0.4 ? '#B8720A' : '#1A7A4A';

  const radialData = [{ name: 'Anomaly', value: anomalyPct, fill: anomalyColor }];

  return (
    <div className="space-y-4">
      <h3
        className="text-sm font-semibold text-foreground"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Social Context
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Propagation speed */}
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Propagation Speed
          </p>
          <p className="mb-3 font-mono-num text-lg font-semibold" style={{ color: '#0D9488' }}>
            {propagationSpeed[propagationSpeed.length - 1]?.shares.toLocaleString() ?? 0} shares
          </p>
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={propagationSpeed} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="prop-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="shares"
                stroke="#0D9488"
                strokeWidth={2}
                fill="url(#prop-gradient)"
                dot={false}
              />
              <XAxis dataKey="hour" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1E2130', border: '1px solid #3D4259', borderRadius: 8, fontSize: 11 }}
                itemStyle={{ color: '#F4F5F8' }}
                labelStyle={{ color: '#8A8FA8', fontFamily: 'var(--font-mono)' }}
                labelFormatter={(v) => `Hour ${v}`}
                formatter={(v) => [`${Number(v).toLocaleString()} shares`, '']}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Reply sentiment */}
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Reply Sentiment
          </p>
          <div className="flex items-center gap-3">
            <PieChart width={70} height={70}>
              <Pie
                data={replySentiment}
                cx={30}
                cy={30}
                innerRadius={18}
                outerRadius={32}
                dataKey="value"
                strokeWidth={0}
              >
                {replySentiment.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="space-y-1 flex-1 min-w-0">
              {replySentiment.slice(0, 3).map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-mono-num font-semibold">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement anomaly */}
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Engagement Anomaly
          </p>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width={70} height={70}>
              <RadialBarChart
                cx={35}
                cy={35}
                innerRadius={18}
                outerRadius={32}
                startAngle={90}
                endAngle={-270}
                data={radialData}
              >
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'var(--muted)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="flex-1 text-right">
              <p
                className="font-mono-num text-2xl font-semibold"
                style={{ color: anomalyColor }}
              >
                {anomalyPct}%
              </p>
              <p className="text-[11px] text-muted-foreground">
                {anomalyPct > 70 ? 'High anomaly' : anomalyPct > 40 ? 'Moderate' : 'Normal'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
