'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Trophy } from 'lucide-react';

export default function GoalSetting() {
  const [dailyGoal, setDailyGoal] = useState(5);
  const [weeklyGoal, setWeeklyGoal] = useState(30);
  const [progress, setProgress] = useState({ daily: 0, weekly: 0 });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('goals');
    if (saved) {
      const goals = JSON.parse(saved);
      setDailyGoal(goals.daily);
      setWeeklyGoal(goals.weekly);
    }
    
    fetch('/api/usage')
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(data => {
        setProgress({
          daily: data.boardsUsedToday || 0,
          weekly: data.boardsUsedMonth || 0,
        });
      })
      .catch(() => setProgress({ daily: 0, weekly: 0 }));
  }, []);

  const saveGoals = () => {
    localStorage.setItem('goals', JSON.stringify({ daily: dailyGoal, weekly: weeklyGoal }));
    setEditing(false);
  };

  const dailyPercent = Math.min((progress.daily / dailyGoal) * 100, 100);
  const weeklyPercent = Math.min((progress.weekly / weeklyGoal) * 100, 100);

  return (
    <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Your Goals
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Daily Goal</label>
              <Input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Weekly Goal</label>
              <Input
                type="number"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                min={1}
              />
            </div>
            <Button onClick={saveGoals} className="w-full">Save Goals</Button>
          </div>
        ) : (
          <>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Daily: {progress.daily}/{dailyGoal} tasks</span>
                <span>{Math.round(dailyPercent)}%</span>
              </div>
              <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                  style={{ width: `${dailyPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Weekly: {progress.weekly}/{weeklyGoal} tasks</span>
                <span>{Math.round(weeklyPercent)}%</span>
              </div>
              <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500"
                  style={{ width: `${weeklyPercent}%` }}
                />
              </div>
            </div>
            {dailyPercent >= 100 && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="text-sm">Daily goal achieved! 🎉</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
