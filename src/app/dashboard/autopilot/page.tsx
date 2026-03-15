'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, AlertTriangle, TrendingUp, Settings, RefreshCw, Zap, Target, Calendar } from 'lucide-react';

interface TimeBlock {
  start: string;
  end: string;
  task: { id: string; title: string; priority: string };
  duration: number;
}

interface Briefing {
  summary: string;
  priorities: Array<{ task: string; reason: string }>;
  schedule: TimeBlock[];
  warnings: string[];
  motivationalQuote: string;
}

interface Adjustment {
  type: string;
  task: string;
  reason: string;
  new_value: { suggestion: string };
  created_at: string;
}

export default function AutopilotPage() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadBriefing();
  }, []);

  const loadBriefing = async () => {
    try {
      const res = await fetch('/api/autopilot/briefing');
      const data = await res.json();
      setBriefing(data.briefing);
      setAdjustments(data.adjustments || []);
    } catch (error) {
      console.error('Failed to load briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBriefing = async () => {
    setGenerating(true);
    try {
      // Fetch tasks from saved boards
      const boardsRes = await fetch('/api/saved-generations');
      const boardsData = await boardsRes.json();

      const allTasks = boardsData.generations?.flatMap((gen: any) =>
        gen.board_data?.columns?.flatMap((col: any) => col.tasks || []) || []
      ) || [];

      const res = await fetch('/api/autopilot/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: allTasks })
      });

      const data = await res.json();
      setBriefing(data.briefing);
      setAdjustments(data.adjustments || []);
    } catch (error) {
      console.error('Failed to generate briefing:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-[#1a1a1a] rounded-lg w-1/3"></div>
          <div className="h-64 bg-[#1a1a1a] rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Autopilot
          </h1>
          <p className="text-muted-foreground mt-1">
            Autonomous workload management powered by AI
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            onClick={generateBriefing}
            disabled={generating}
            className="bg-primary hover:bg-primary/90"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Briefing
              </>
            )}
          </Button>
        </div>
      </div>

      {!briefing ? (
        <Card className="p-12 text-center border-[#262626] bg-[#141414]">
          <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Briefing Yet</h2>
          <p className="text-muted-foreground mb-6">
            Generate your first AI powered morning briefing to get started
          </p>
          <Button
            onClick={generateBriefing}
            className="bg-primary hover:bg-primary/90"
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate Now
          </Button>
        </Card>
      ) : (
        <>
          {/* Morning Briefing */}
          <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">☀️ Good Morning!</h2>
                <p className="text-muted-foreground">{briefing.summary}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>

            {briefing.warnings.length > 0 && (
              <div className="mt-4 p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">Alerts</span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {briefing.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg">
              <p className="italic text-center text-muted-foreground">
                &quot;{briefing.motivationalQuote}&quot;
              </p>
            </div>
          </Card>

          {/* Top 3 Priorities */}
          <Card className="p-6 border-[#262626] bg-[#141414]">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Top 3 Priorities</h2>
            </div>
            <div className="space-y-4">
              {briefing.priorities.map((priority, i) => (
                <div key={i} className="flex gap-4 p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{priority.task}</h3>
                    <p className="text-sm text-muted-foreground">{priority.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Time-Blocked Schedule */}
          <Card className="p-6 border-[#262626] bg-[#141414]">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Today&apos;s Schedule</h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {briefing.schedule.length} tasks scheduled
              </span>
            </div>
            <div className="space-y-3">
              {briefing.schedule.map((block, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-l-4 border-primary bg-[#1a1a1a] rounded-r-lg hover:bg-[#1f1f1f] transition-colors">
                  <div className="flex-shrink-0 text-center">
                    <div className="text-sm font-semibold text-primary">{block.start}</div>
                    <div className="text-xs text-muted-foreground">↓</div>
                    <div className="text-sm font-semibold text-primary">{block.end}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{block.task.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        block.task.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        block.task.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        block.task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {block.task.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">{block.duration} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Real-Time Adjustments */}
          {adjustments.length > 0 && (
            <Card className="p-6 border-[#262626] bg-[#141414]">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <h2 className="text-2xl font-bold">AI Adjustments</h2>
              </div>
              <div className="space-y-3">
                {adjustments.map((adj, i) => (
                  <div key={i} className="p-4 bg-[#1a1a1a] border border-green-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                        <Zap className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{adj.task}</span>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                            {adj.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{adj.reason}</p>
                        <p className="text-sm font-medium text-green-400">
                          💡 {adj.new_value.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
