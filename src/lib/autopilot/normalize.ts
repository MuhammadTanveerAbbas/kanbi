/**
 * Normalisation for the autopilot briefing payload.
 *
 * The briefing endpoint emits schedule blocks shaped as
 * `{ start, end, task: Task, duration: number }`, where duration is in minutes.
 * The dashboard needs `{ time: string, task: string, duration: string }`.
 *
 * Doing that conversion in one tested place matters: reading `task` directly
 * from the response gave React an object to render, which threw and surfaced as
 * a generic "Something went wrong" from the error boundary. Every field the
 * interface renders is guaranteed to be a string by this module.
 */

export interface ScheduleBlockView {
  /** Human readable time range, for example "09:00 - 10:00". */
  time: string;
  /** Task title. Never an object. */
  task: string;
  /** Formatted duration, for example "1h 30m". */
  duration: string;
}

export interface BriefingView {
  summary: string;
  schedule: ScheduleBlockView[];
  healthNote: string;
  quote: string;
  /** Top priorities with the reason each was chosen. */
  priorities: Array<{ task: string; reason: string }>;
  warnings: string[];
}

const DEFAULT_TIME = 'Unscheduled';
const DEFAULT_TASK = 'Untitled task';
const DEFAULT_DURATION = '30m';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Formats a duration in minutes as a short, readable string. */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m';
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** Reads a task title from any of the shapes the API or database can return. */
function readTaskTitle(raw: Record<string, unknown>): string {
  if (typeof raw.task === 'string') return raw.task.trim() || DEFAULT_TASK;
  if (isRecord(raw.task)) {
    const nested = raw.task.title ?? raw.task.name;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  if (typeof raw.task_title === 'string') return raw.task_title.trim() || DEFAULT_TASK;
  if (typeof raw.title === 'string') return raw.title.trim() || DEFAULT_TASK;
  return DEFAULT_TASK;
}

/** Reads a time range from any of the shapes the API or database can return. */
function readTimeRange(raw: Record<string, unknown>): string {
  if (typeof raw.time === 'string' && raw.time.trim()) return raw.time.trim();

  const start = typeof raw.start === 'string' ? raw.start : null;
  const end = typeof raw.end === 'string' ? raw.end : null;
  if (start && end) return `${start} - ${end}`;

  // The database stores the range as one hyphenated string.
  if (typeof raw.time_block === 'string' && raw.time_block.trim()) {
    return raw.time_block.trim().replace('-', ' - ');
  }
  return DEFAULT_TIME;
}

function readDuration(raw: Record<string, unknown>): string {
  if (typeof raw.duration === 'string' && raw.duration.trim()) return raw.duration.trim();
  if (typeof raw.duration === 'number') return formatMinutes(raw.duration);
  if (typeof raw.estimated_duration === 'string' && raw.estimated_duration.trim()) {
    return raw.estimated_duration.trim();
  }
  if (typeof raw.estimated_duration === 'number') return formatMinutes(raw.estimated_duration);
  return DEFAULT_DURATION;
}

/** Converts one schedule block into a shape that is safe to render. */
export function normalizeScheduleBlock(raw: unknown): ScheduleBlockView {
  if (!isRecord(raw)) {
    return { time: DEFAULT_TIME, task: DEFAULT_TASK, duration: DEFAULT_DURATION };
  }
  return {
    time: readTimeRange(raw),
    task: readTaskTitle(raw),
    duration: readDuration(raw),
  };
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

/**
 * Converts the briefing endpoint response into the shape the interface renders.
 * Never throws, and never returns a field that is not a string.
 */
export function normalizeBriefingResponse(
  raw: unknown,
  fallback: { pendingCount?: number; healthNote?: string } = {}
): BriefingView {
  if (!isRecord(raw)) {
    return {
      summary: 'No briefing could be generated.',
      schedule: [],
      healthNote: fallback.healthNote ?? 'No warnings for today.',
      quote: '',
      priorities: [],
      warnings: [],
    };
  }

  const briefing = isRecord(raw.briefing) ? raw.briefing : null;
  const source = briefing ?? raw;

  // The schedule can arrive nested under briefing, at the top level, or both.
  const scheduleSource = Array.isArray(source.schedule)
    ? source.schedule
    : Array.isArray(raw.schedule)
      ? raw.schedule
      : [];

  const warnings = readStringArray(source.warnings);
  const priorities = Array.isArray(source.priorities)
    ? source.priorities
        .map((item) => {
          if (!isRecord(item)) return null;
          const task = typeof item.task === 'string' ? item.task.trim() : '';
          const reason = typeof item.reason === 'string' ? item.reason.trim() : '';
          if (!task) return null;
          return { task, reason };
        })
        .filter((item): item is { task: string; reason: string } => item !== null)
    : [];

  const pendingCount = fallback.pendingCount ?? 0;
  const summary =
    (typeof source.summary === 'string' && source.summary.trim()) ||
    (pendingCount > 0
      ? `You have ${pendingCount} pending ${pendingCount === 1 ? 'task' : 'tasks'} today.`
      : 'Your board is clear. Add a task to get started.');

  return {
    summary,
    schedule: scheduleSource
      .map(normalizeScheduleBlock)
      .filter((block) => block.task !== DEFAULT_TASK || block.time !== DEFAULT_TIME),
    healthNote: warnings[0] ?? fallback.healthNote ?? 'No warnings for today.',
    quote: typeof source.motivationalQuote === 'string' ? source.motivationalQuote.trim() : '',
    priorities,
    warnings,
  };
}
