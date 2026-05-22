// AI Autopilot Engine kanbi autonomous daily scheduling and workload management

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  estimatedTime?: number;
}

interface AutopilotSettings {
  work_hours_start: string;
  work_hours_end: string;
  break_duration: number;
  max_daily_tasks: number;
}

interface TimeBlock {
  start: string;
  end: string;
  task: Task;
  duration: number;
}

interface MorningBriefing {
  summary: string;
  priorities: Array<{ task: string; reason: string }>;
  schedule: TimeBlock[];
  warnings: string[];
  motivationalQuote: string;
}

/** Returns estimated task duration in minutes, using stored estimate or priority-based defaults. */
export function estimateTaskDuration(task: Task): number {
  if (task.estimatedTime) return task.estimatedTime;
  
  const baseDurations = {
    urgent: 45,
    high: 60,
    medium: 90,
    low: 120
  };
  
  return baseDurations[task.priority] || 60;
}

/** Sorts tasks by priority score, then by title length as a tiebreaker (shorter = more focused). */
export function autoPrioritizeTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    const priorityScore = { urgent: 4, high: 3, medium: 2, low: 1 };
    const scoreA = priorityScore[a.priority] || 0;
    const scoreB = priorityScore[b.priority] || 0;
    
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    // Secondary sort by title length (shorter = more focused)
    return a.title.length - b.title.length;
  });
}

/** Builds a time-blocked schedule within the user's configured work hours. */
export function generateDailySchedule(
  tasks: Task[],
  settings: AutopilotSettings
): TimeBlock[] {
  const schedule: TimeBlock[] = [];
  const [startHour, startMin] = settings.work_hours_start.split(':').map(Number) as [number, number];
  const [endHour, endMin] = settings.work_hours_end.split(':').map(Number) as [number, number];
  
  const workMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  let currentMinute = startHour * 60 + startMin;
  
  const prioritizedTasks = autoPrioritizeTasks(tasks.filter(t => t.status !== 'done'))
    .slice(0, settings.max_daily_tasks);
  
  for (const task of prioritizedTasks) {
    const duration = estimateTaskDuration(task);
    
    if (currentMinute + duration > endHour * 60 + endMin) break;
    
    const startTime = `${String(Math.floor(currentMinute / 60)).padStart(2, '0')}:${String(currentMinute % 60).padStart(2, '0')}`;
    currentMinute += duration;
    const endTime = `${String(Math.floor(currentMinute / 60)).padStart(2, '0')}:${String(currentMinute % 60).padStart(2, '0')}`;
    
    schedule.push({ start: startTime, end: endTime, task, duration });

    currentMinute += settings.break_duration;
  }
  
  return schedule;
}

/** Generates a morning briefing summary, top priorities, warnings, and a motivational quote. */
export function generateMorningBriefing(
  tasks: Task[],
  schedule: TimeBlock[],
  healthScore: number
): MorningBriefing {
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const urgentCount = pendingTasks.filter(t => t.priority === 'urgent').length;
  const highCount = pendingTasks.filter(t => t.priority === 'high').length;
  
  const warnings: string[] = [];
  if (healthScore < 50) warnings.push('⚠️ High workload detected - consider deferring low-priority tasks');
  if (urgentCount > 3) warnings.push('🔥 Multiple urgent tasks - focus mode recommended');
  if (schedule.length < pendingTasks.length) warnings.push('📅 Not all tasks fit today - autopilot will reschedule overflow');
  
  const priorities = schedule.slice(0, 3).map((block, i) => ({
    task: block.task.title,
    reason: i === 0 ? 'Highest priority and urgency' : i === 1 ? 'Critical for today\'s goals' : 'Important follow-up task'
  }));
  
  const quotes = [
    'Focus on progress, not perfection.',
    'Small steps lead to big achievements.',
    'Your future self will thank you.',
    'Consistency beats intensity.',
    'Make today count.'
  ];
  
  const summary = `Good morning! You have ${schedule.length} tasks scheduled today (${urgentCount} urgent, ${highCount} high priority). Your workload health is ${healthScore}/100. ${healthScore >= 70 ? 'You\'re in great shape!' : healthScore >= 50 ? 'Manageable workload ahead.' : 'Take it easy and pace yourself.'}`;
  
  return {
    summary,
    priorities,
    schedule,
    warnings,
    motivationalQuote: quotes[Math.floor(Math.random() * quotes.length)] ?? 'Make today count.'
  };
}

/** Detects scheduling blockers (too many urgent tasks, long tasks, missing breaks) and returns adjustment suggestions. */
export function detectBlockersAndAdjust(
  tasks: Task[],
  schedule: TimeBlock[]
): Array<{ type: string; task: string; reason: string; suggestion: string }> {
  const adjustments: Array<{ type: string; task: string; reason: string; suggestion: string }> = [];
  
  // Detect overdue urgent tasks
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
  if (urgentTasks.length > 5) {
    adjustments.push({
      type: 'reprioritize',
      task: 'Multiple urgent tasks',
      reason: 'Too many urgent items causing bottleneck',
      suggestion: 'Defer 2-3 less critical tasks to tomorrow'
    });
  }
  
  // Detect long tasks that need breaking down
  schedule.forEach(block => {
    if (block.duration > 120) {
      adjustments.push({
        type: 'break_down',
        task: block.task.title,
        reason: 'Task duration exceeds 2 hours',
        suggestion: 'Break into smaller 45-60 minute chunks'
      });
    }
  });
  
  // Detect no breaks
  if (schedule.length > 4) {
    adjustments.push({
      type: 'add_break',
      task: 'Schedule',
      reason: 'Long work session without adequate breaks',
      suggestion: 'Add 15-minute breaks every 2 hours'
    });
  }
  
  return adjustments;
}

/** Returns tasks that didn't fit today's schedule with suggested rescheduled dates. */
export function rescheduleOverflow(
  tasks: Task[],
  scheduledTasks: Task[]
): Array<{ task: Task; newDate: string; reason: string }> {
  const scheduledIds = new Set(scheduledTasks.map(t => t.id));
  const overflow = tasks.filter(t => !scheduledIds.has(t.id) && t.status !== 'done');
  
  return overflow.map((task, i) => ({
    task,
    newDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
    reason: task.priority === 'low' ? 'Low priority - deferred to maintain focus' : 'Capacity reached - rescheduled to next available slot'
  }));
}
