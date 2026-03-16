'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, AlertTriangle, TrendingUp, RefreshCw, Zap, Target, Calendar, Lightbulb } from 'lucide-react';

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
      if (!res.ok) throw new Error('Failed to fetch briefing');
      const data = await res.json();
      setBriefing(data.briefing);
      setAdjustments(data.adjustments || []);
    } catch (error) {
      console.error('Failed to load briefing:', error);
      setBriefing(null);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  const generateBriefing = async () => {
    setGenerating(true);
    try {
      const boardsRes = await fetch('/api/saved-generations');
      if (!boardsRes.ok) throw new Error('Failed to fetch boards');
      const boardsData = await boardsRes.json();

      const allTasks = boardsData.generations?.flatMap((gen: any) =>
        gen.board_data?.columns?.flatMap((col: any) => col.tasks || []) || []
      ) || [];

      if (allTasks.length === 0) {
        console.warn('No tasks found to generate briefing');
        return;
      }

      const res = await fetch('/api/autopilot/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: allTasks })
      });

      if (!res.ok) throw new Error('Failed to generate briefing');
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
      <div className="w-full space-y-2 sm:space-y-3">
        <div className="animate-pulse space-y-2 sm:space-y-3">
          <div className="h-8 sm:h-10 bg-[#1a1a1a] rounded-lg w-1/2 sm:w-1/3"></div>
          <div className="h-40 sm:h-48 bg-[#1a1a1a] rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <span className="truncate">AI Autopilot</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-1">
            Autonomous workload management
          </p>
        </div>
        <Button
          onClick={generateBriefing}
          disabled={generating}
          className="bg-primary hover:bg-primary/90 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9 w-fit"
          size="sm"
        >
          {generating ? (
            <>
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              <span className="hidden sm:inline">Gen...</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Generate</span>
              <span className="sm:hidden">Gen</span>
            </>
          )}
        </Button>
      </div>

      {!briefing ? (
        <Card className="p-4 sm:p-6 text-center border-[#262626] bg-[#141414]">
          <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-primary mb-2" />
          <h2 className="text-lg sm:text-xl font-bold mb-1">No Briefing Yet</h2>
          <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
            Generate your first AI powered morning briefing
          </p>
          <Button
            onClick={generateBriefing}
            className="bg-primary hover:bg-primary/90 text-xs sm:text-sm px-3 py-1 h-8"
          >
            <Zap className="w-3 h-3 mr-1" />
            Generate Now
          </Button>
        </Card>
      ) : (
        <>
          {/* Morning Briefing */}
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span>Good Morning!</span>
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">{briefing.summary}</p>
              </div>
            </div>

            {briefing.warnings.length > 0 && (
              <div className="mt-2 p-2 sm:p-3 bg-[#1a1a1a] border border-[#262626] rounded">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm">Alerts</span>
                </div>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {briefing.warnings.slice(0, 2).map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-2 p-2 sm:p-3 bg-[#1a1a1a] border border-[#262626] rounded">
              <p className="italic text-center text-muted-foreground text-xs">
                &quot;{briefing.motivationalQuote}&quot;
              </p>
            </div>
          </Card>

          {/* Top 3 Priorities */}
          <Card className="p-3 sm:p-4 border-[#262626] bg-[#141414]">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold">Top 3 Priorities</h2>
            </div>
            <div className="space-y-2">
              {briefing.priorities.map((priority, i) => (
                <div key={i} className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-[#1a1a1a] border border-[#262626] rounded hover:border-primary/50 transition-colors">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm truncate">{priority.task}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{priority.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Time-Blocked Schedule */}
          <Card className="p-3 sm:p-4 border-[#262626] bg-[#141414]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-bold">Today&apos;s Schedule</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {briefing.schedule.length} tasks
              </span>
            </div>
            <div className="space-y-1 sm:space-y-2">
              {briefing.schedule.map((block, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2 sm:p-3 border-l-3 border-primary bg-[#1a1a1a] rounded-r hover:bg-[#1f1f1f] transition-colors">
                  <div className="flex-shrink-0 text-center text-xs">
                    <div className="font-semibold text-primary">{block.start}</div>
                    <div className="text-muted-foreground text-xs">-</div>
                    <div className="font-semibold text-primary">{block.end}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm truncate">{block.task.title}</h3>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        block.task.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        block.task.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        block.task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {block.task.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">{block.duration}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Real-Time Adjustments */}
          {adjustments.length > 0 && (
            <Card className="p-3 sm:p-4 border-[#262626] bg-[#141414]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-bold">AI Adjustments</h2>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {adjustments.slice(0, 3).map((adj, i) => (
                  <div key={i} className="p-2 sm:p-3 bg-[#1a1a1a] border border-green-500/30 rounded">
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                        <Lightbulb className="w-3 h-3 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm truncate">{adj.task}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30 flex-shrink-0">
                            {adj.type?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{adj.reason}</p>
                        <p className="text-xs font-medium text-green-400 flex items-center gap-1">
                          <Lightbulb className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="line-clamp-1">{adj.new_value?.suggestion || 'Adjustment recommended'}</span>
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
