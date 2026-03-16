'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Task } from '@/lib/types';

interface WorkloadAnalysis {
  healthScore: number;
  totalTasks: number;
  estimatedHours: number;
  capacityHours: number;
  overloadHours: number;
  taskBreakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  insights: string[];
  suggestions: string[];
  status: 'healthy' | 'busy' | 'overloaded' | 'critical';
}

interface WorkloadHealthProps {
  tasks?: Task[];
}

export default function WorkloadHealth({ tasks = [] }: WorkloadHealthProps) {
  const [analysis, setAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Debounce analysis to avoid too many calls
    const timeoutId = setTimeout(() => {
      analyzeWorkload();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(tasks)]);

  const analyzeWorkload = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/analyze-workload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Failed to analyze workload:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Workload Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const getStatusIcon = () => {
    switch (analysis.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'busy':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'overloaded':
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getScoreColor = () => {
    if (analysis.healthScore >= 80) return 'text-gray-400';
    if (analysis.healthScore >= 50) return 'text-yellow-500';
    if (analysis.healthScore >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Workload Health
          </div>
          <Badge variant="outline" className={`${getScoreColor()} border-current`}>
            {analysis.healthScore}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Health Score</span>
            <span className={getScoreColor()}>{analysis.healthScore}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                analysis.healthScore >= 80
                  ? 'bg-gray-500'
                  : analysis.healthScore >= 50
                  ? 'bg-yellow-500'
                  : analysis.healthScore >= 25
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${analysis.healthScore}%` }}
            />
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-2">
          {analysis.insights.map((insight, index) => (
            <p key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{insight}</span>
            </p>
          ))}
        </div>

        {/* Task Breakdown */}
        <div className="pt-3 border-t border-gray-800">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-red-400">Urgent</p>
              <p className="text-lg font-bold">{analysis.taskBreakdown.urgent}</p>
            </div>
            <div>
              <p className="text-xs text-orange-400">High</p>
              <p className="text-lg font-bold">{analysis.taskBreakdown.high}</p>
            </div>
            <div>
              <p className="text-xs text-yellow-400">Medium</p>
              <p className="text-lg font-bold">{analysis.taskBreakdown.medium}</p>
            </div>
            <div>
              <p className="text-xs text-blue-400">Low</p>
              <p className="text-lg font-bold">{analysis.taskBreakdown.low}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
