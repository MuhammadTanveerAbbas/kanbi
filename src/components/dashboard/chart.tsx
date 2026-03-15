'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: Array<{ date: string; count: number }>;
}

export default function Chart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#666"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#262626' }}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis
          stroke="#666"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#262626' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            fontSize: '14px',
          }}
          labelStyle={{ color: '#fff', marginBottom: '4px' }}
          cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#6b7280"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCount)"
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
