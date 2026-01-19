'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280'];

export default function TaskStatistics({ stats }: { stats: any }) {
  const priorityData = [
    { name: 'Urgent', value: stats?.urgent || 0 },
    { name: 'High', value: stats?.high || 0 },
    { name: 'Medium', value: stats?.medium || 0 },
    { name: 'Low', value: stats?.low || 0 },
  ].filter(item => item.value > 0);

  const completionRate = stats?.total > 0 
    ? Math.round((stats?.completed / stats?.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
        <CardHeader>
          <CardTitle className="text-lg">Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[180px] sm:h-[200px]">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="#262626"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="#6b7280"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - completionRate / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold">{completionRate}%</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
            {stats?.completed || 0} of {stats?.total || 0} tasks completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
