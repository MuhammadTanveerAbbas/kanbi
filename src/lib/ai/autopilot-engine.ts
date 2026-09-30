/**
 * Autopilot scheduling engine.
 *
 * Every function here is deterministic. The same board and the same settings
 * always produce the same schedule, which is what makes the daily briefing
 * something a user can rely on rather than a random suggestion.
 *
 * No language model is involved in scheduling. The only probabilistic part of
 * the product is which words in a note are tasks, and that happens before a task
 * ever reaches this file.
 */

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AutopilotTask {
  id: string;
  title: string;
  priority: TaskPriority;
  status: string;
  /** Duration in minutes, when known from a stored measurement. */
  estimatedTime?: number;
  /**
   * Human readable estimate as entered on the board, for example "1h" or
   * "90m". This is what the dashboard actually sends, so it is read in
   * preference to the numeric field.
   */
  estimate?: string;
}

export interface AutopilotSettings {
  work_hours_start: string;
  work_hours_end: string;
  break_duration: number;
  max_daily_tasks: number;
}

export interface TimeBlock {
  start: string;
  end: string;
  task: AutopilotTask;
  duration: number;
}

export interface MorningBriefing {
  summary: string;
  priorities: Array<{ task: string; reason: string }>;
  schedule: TimeBlock[];
  warnings: string[];
  motivationalQuote: string;
}

export interface Adjustment {
  type: string;
  task: string;
  reason: string;
  suggestion: string;
}

const MINUTES_PER_DAY = 24 * 60;

/**
 * Fallback duration in minutes per priority, used only when the user has not
 * supplied an estimate. These reflect that an urgent item is usually a small,
 * immediately actionable thing while low priority work tends to be larger and
 * more open ended.
 */
const DEFAULT_DURATION_MINUTES: Record<TaskPriority, number> = {
  urgent: 45,
  high: 60,
  medium: 90,
  low: 120,
};

/** Longest single block the scheduler will place, to keep the day usable. */
const MAX_BLOCK_MINUTES = 180;

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const QUOTES = [
  'Focus on progress, not perfection.',
  'Small steps lead to big achievements.',
  'Your future self will thank you.',
  'Consistency beats intensity.',
  'A finished task beats a perfect plan.',
];

/**
 * Parses a human written estimate such as "1h", "90m", "1h 30m", "2 hours".
 * Returns null when the value cannot be understood, so the caller can fall back
 * rather than schedule a zero length block.
 */
export function parseEstimate(input: string | undefined | null): number | null {
  if (typeof input !== 'string') return null;
  const text = input.trim().toLowerCase();
  if (!text) return null;

  // A leading minus is rejected outright. The number patterns below would
  // otherwise skip the sign and return a positive duration, so "-30m" would
  // quietly become thirty minutes.
  if (text.startsWith('-')) return null;

  let total = 0;
  let matched = false;

  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/);
  if (hours) {
    total += Math.round(Number(hours[1]) * 60);
    matched = true;
  }

  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/);
  if (minutes) {
    total += Math.round(Number(minutes[1]));
    matched = true;
  }

  // A bare number is read as minutes, which is how people usually mean it.
  if (!matched) {
    const bare = text.match(/^(\d+(?:\.\d+)?)$/);
    if (bare) {
      total = Math.round(Number(bare[1]));
      matched = true;
    }
  }

  if (!matched || !Number.isFinite(total) || total <= 0) return null;
  return Math.min(total, MAX_BLOCK_MINUTES);
}

/**
 * Duration for a task in minutes.
 *
 * A user supplied estimate always wins over a default, because it reflects what
 * the person actually knows about the work.
 */
export function estimateTaskDuration(task: AutopilotTask): number {
  if (typeof task.estimatedTime === 'number' && task.estimatedTime > 0) {
    return Math.min(task.estimatedTime, MAX_BLOCK_MINUTES);
  }

  const parsed = parseEstimate(task.estimate);
  if (parsed !== null) return parsed;

  return DEFAULT_DURATION_MINUTES[task.priority] ?? 60;
}

function formatClock(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, MINUTES_PER_DAY - 1));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function parseClock(value: string, fallbackMinutes: number): number {
  const match = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallbackMinutes;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallbackMinutes;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallbackMinutes;
  return hours * 60 + minutes;
}

/**
 * Orders tasks by priority, then by how much time they need so that short wins
 * are scheduled first and the day still has room for the larger items.
 */
export function autoPrioritizeTasks(tasks: AutopilotTask[]): AutopilotTask[] {
  return [...tasks].sort((a, b) => {
    const rankDiff = (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0);
    if (rankDiff !== 0) return rankDiff;

    // Same priority. The largest task is placed first so it is not the item that
    // runs out of room at the end of the day.
    const durationDiff = estimateTaskDuration(b) - estimateTaskDuration(a);
    if (durationDiff !== 0) return durationDiff;

    // Final tiebreak keeps ordering stable between runs.
    return a.id.localeCompare(b.id);
  });
}

/**
 * Builds a time blocked schedule inside the configured working hours.
 *
 * A task that cannot fit in the remaining time is skipped rather than truncated,
 * and the break is only inserted between blocks.
 */
export function generateDailySchedule(
  tasks: AutopilotTask[],
  settings: AutopilotSettings
): TimeBlock[] {
  const schedule: TimeBlock[] = [];
  if (!Array.isArray(tasks) || tasks.length === 0) return schedule;

  const startMinutes = parseClock(settings.work_hours_start, 9 * 60);
  const endMinutes = parseClock(settings.work_hours_end, 17 * 60);
  if (endMinutes <= startMinutes) return schedule;

  const breakDuration = Number.isFinite(settings.break_duration)
    ? Math.max(0, Math.round(settings.break_duration))
    : 0;

  const maxTasks = Number.isFinite(settings.max_daily_tasks)
    ? Math.max(0, Math.floor(settings.max_daily_tasks))
    : 8;

  const pending = tasks.filter((t) => t && t.status !== 'done' && typeof t.title === 'string');
  const prioritized = autoPrioritizeTasks(pending).slice(0, maxTasks);

  let cursor = startMinutes;
  for (const task of prioritized) {
    const duration = estimateTaskDuration(task);
    if (duration <= 0) continue;

    // The break belongs between blocks, not before the first one.
    if (schedule.length > 0 && breakDuration > 0) cursor += breakDuration;

    if (cursor + duration > endMinutes) {
      // Skip this task and keep going. Breaking here would let one oversized item
      // push every smaller task after it out of the day, even when those would
      // have fitted comfortably in the remaining time.
      continue;
    }

    const start = formatClock(cursor);
    cursor += duration;
    const end = formatClock(cursor);

    schedule.push({ start, end, task, duration });
  }

  return schedule;
}

/** Builds the summary, priorities, warnings, and closing line for the day. */
export function generateMorningBriefing(
  tasks: AutopilotTask[],
  schedule: TimeBlock[],
  healthScore: number
): MorningBriefing {
  const list = Array.isArray(tasks) ? tasks : [];
  const blocks = Array.isArray(schedule) ? schedule : [];

  const pending = list.filter((t) => t && t.status !== 'done');
  const urgentCount = pending.filter((t) => t.priority === 'urgent').length;
  const highCount = pending.filter((t) => t.priority === 'high').length;
  const scheduledMinutes = blocks.reduce((sum, b) => sum + b.duration, 0);

  const warnings: string[] = [];
  if (healthScore < 50) {
    warnings.push('High workload detected. Consider deferring low priority tasks.');
  }
  if (urgentCount > 3) {
    warnings.push(`${urgentCount} urgent tasks are competing for the same attention.`);
  }
  if (pending.length > blocks.length) {
    const dropped = pending.length - blocks.length;
    warnings.push(
      `${dropped} ${dropped === 1 ? 'task does' : 'tasks do'} not fit into your working hours today.`
    );
  }
  if (blocks.length === 0 && pending.length > 0) {
    warnings.push('Nothing fits into your working hours. Try a longer day or a smaller estimate.');
  }

  const reasons = [
    'Highest priority on the board.',
    'Largest item scheduled first so the day still has room.',
    'Next most important task after the first two.',
  ];

  const priorities = blocks.slice(0, 3).map((block, index) => ({
    task: block.task.title,
    reason: reasons[index] ?? 'Also scheduled today.',
  }));

  const score = Number.isFinite(healthScore) ? healthScore : 0;
  const outlook =
    score >= 70
      ? 'Your workload looks balanced.'
      : score >= 50
        ? 'A full but manageable day.'
        : 'A heavy day. Pace yourself.';

  const summary =
    pending.length === 0
      ? 'Your board is clear. Nothing is scheduled today.'
      : `${blocks.length} of ${pending.length} pending ${pending.length === 1 ? 'task is' : 'tasks are'} scheduled today, ` +
        `with ${urgentCount} urgent and ${highCount} high priority. ` +
        `That is ${formatClock(scheduledMinutes)} of focused work. ${outlook}`;

  return {
    summary,
    priorities,
    schedule: blocks,
    warnings,
    // A fixed rotation rather than a random pick, so the same day does not
    // present a different line on every render.
    motivationalQuote: QUOTES[blocks.length % QUOTES.length] ?? QUOTES[0]!,
  };
}

/** Detects scheduling problems and returns concrete, actionable adjustments. */
export function detectBlockersAndAdjust(
  tasks: AutopilotTask[],
  schedule: TimeBlock[]
): Adjustment[] {
  const adjustments: Adjustment[] = [];
  const list = Array.isArray(tasks) ? tasks : [];
  const blocks = Array.isArray(schedule) ? schedule : [];

  const urgentOpen = list.filter((t) => t && t.priority === 'urgent' && t.status !== 'done');
  if (urgentOpen.length > 5) {
    adjustments.push({
      type: 'reprioritize',
      task: 'Multiple urgent tasks',
      reason: 'More than five urgent tasks are open at the same time',
      suggestion: 'Move the two least urgent of them to next week so the rest become genuinely urgent.',
    });
  }

  for (const block of blocks) {
    if (block.duration > 120) {
      adjustments.push({
        type: 'break_down',
        task: block.task.title,
        reason: 'This block is longer than two hours',
        suggestion: 'Split it into two blocks of about an hour with a break between them.',
      });
    }
  }

  if (blocks.length > 6) {
    adjustments.push({
      type: 'reduce_load',
      task: 'Today',
      reason: 'More than six blocks were scheduled',
      suggestion: 'Move the lowest priority item to tomorrow. A shorter list gets finished.',
    });
  }

  return adjustments;
}

/** Returns the tasks that did not fit into the schedule. */
export function rescheduleOverflow(
  tasks: AutopilotTask[],
  scheduled: AutopilotTask[]
): AutopilotTask[] {
  const scheduledIds = new Set((scheduled ?? []).map((t) => t?.id).filter(Boolean));
  return (tasks ?? [])
    .filter((t) => t && t.status !== 'done' && !scheduledIds.has(t.id))
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0));
}
