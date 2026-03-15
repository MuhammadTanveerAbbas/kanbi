'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, TrendingUp, Lightbulb } from 'lucide-react';
import { Task } from '@/lib/types';

interface WorkloadAnalysis {
  healthScore: number;
  totalTasks: number;
  estimatedHours: number;
  capacityHours: number;
  insights: string[];
  suggestions: string[];
  status: 'healthy' | 'busy' | 'overloaded' | 'critical';
}

interface AIInsightsPanelProps {
  tasks: Task[];
}

export default function AIInsightsPanel({ tasks }: AIInsightsPanelProps) {
  const [analysis, setAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tasks.length > 0) {
      // Debounce analysis
      const timeoutId = setTimeout(() => {
        analyzeWorkload();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setAnalysis(null);
      setLoading(false);
    }
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
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-gray-800 rounded w-full"></div>
            <div className="h-3 bg-gray-800 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || tasks.length === 0) {
    return (
      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add tasks to get AI powered insights about your workload
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    const colors = {
      healthy: 'bg-green-500/10 text-green-500 border-green-500/20',
      busy: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      overloaded: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    const labels = {
      healthy: '✅ On Track',
      busy: '⚡ Busy',
      overloaded: '⚠️ Overloaded',
      critical: '🚨 Critical',
    };

    return (
      <Badge variant="outline" className={colors[analysis.status]}>
        {labels[analysis.status]}
      </Badge>
    );
  };

  return (
    <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
            <p className="text-xl font-bold">{analysis.totalTasks}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-primary" />
              <p className="text-xs text-muted-foreground">Est. Time</p>
            </div>
            <p className="text-xl font-bold">{analysis.estimatedHours}h</p>
          </div>
        </div>

        {/* Health Score */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Workload Health</span>
            <span className={
              analysis.healthScore >= 80 ? 'text-green-500' :
              analysis.healthScore >= 50 ? 'text-yellow-500' :
              'text-red-500'
            }>
              {analysis.healthScore}/100
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                analysis.healthScore >= 80 ? 'bg-green-500' :
                analysis.healthScore >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${analysis.healthScore}%` }}
            />
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Lightbulb className="h-3 w-3 text-yellow-500" />
            <span>Smart Tips</span>
          </div>
          {analysis.suggestions.slice(0, 3).map((suggestion, index) => (
            <p key={index} className="text-xs text-muted-foreground pl-5">
              • {suggestion}
            </p>
          ))}
        </div>

        {/* Capacity Info */}
        <div className="pt-3 border-t border-gray-800">
          <p className="text-xs text-muted-foreground">
            Daily capacity: {analysis.capacityHours}h
            {analysis.estimatedHours > analysis.capacityHours && (
              <span className="text-red-400 ml-1">
                (+{(analysis.estimatedHours - analysis.capacityHours).toFixed(1)}h over)
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
