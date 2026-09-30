// Application-wide constants
export const DEBOUNCE_DELAY = 3000; // ms
export const AUTO_SAVE_DELAY = 3000; // ms
export const DAILY_CAPACITY_HOURS = 6; // hours
export const CONTEXT_SWITCHING_COST = 15; // minutes

// Health score thresholds
export const HEALTH_SCORE_THRESHOLDS = {
  EXCELLENT: 0.7,
  GOOD: 1.0,
  MODERATE: 1.5,
  POOR: 2.0,
} as const;

// Task priorities as used by the workload analysis layer, which works in
// display-cased labels.
export const TASK_PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'] as const;

// Task statuses as used by the workload analysis layer.
export const TASK_STATUSES = ['To Do', 'In Progress', 'Done'] as const;

// Task priorities as stored in the database and sent by the client. These are
// the same four levels in a different casing, and the two vocabularies must not
// be interchanged.
export const BOARD_TASK_PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;

// Task statuses as stored in the database and sent by the client.
export const BOARD_TASK_STATUSES = ['todo', 'wip', 'done'] as const;

export type BoardTaskPriority = (typeof BOARD_TASK_PRIORITIES)[number];
export type BoardTaskStatus = (typeof BOARD_TASK_STATUSES)[number];

/**
 * Kanban columns in display order. Exporters group by these, so a single
 * definition prevents a mismatch between stored casing and display labels.
 */
export const BOARD_TASK_COLUMNS: ReadonlyArray<{
  status: BoardTaskStatus;
  label: string;
}> = [
  { status: 'todo', label: 'To Do' },
  { status: 'wip', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

/** Display labels for stored priority values. */
export const PRIORITY_LABELS: Record<BoardTaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/**
 * Colour for each priority, used by the exporters.
 *
 * These were emoji until this release. A Word or PDF document should not depend
 * on the reader having a colour emoji font installed, and a printed export should
 * not rely on colour alone, so each export prints the priority as a word too.
 */
export const PRIORITY_COLORS: Record<BoardTaskPriority, string> = {
  urgent: 'E11D48',
  high: 'EA580C',
  medium: 'CA8A04',
  low: '16A34A',
};

// Toast duration
export const TOAST_DURATION = 3000; // ms

// API timeouts
export const API_TIMEOUT = 30000; // ms
export const FETCH_TIMEOUT = 15000; // ms

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// AI Models
export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
export const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Usage limits
export const USAGE_LIMITS = {
  FREE: {
    DAILY_EXTRACTIONS: 10,
    MONTHLY_EXTRACTIONS: 300,
    DAILY_BOARDS: 10,
    MONTHLY_BOARDS: 300,
    DAILY_AI: 10,
    MONTHLY_AI: 300,
  },
  PREMIUM: {
    DAILY_EXTRACTIONS: 100,
    MONTHLY_EXTRACTIONS: 1500,
    DAILY_BOARDS: 100,
    MONTHLY_BOARDS: 1500,
    DAILY_AI: 100,
    MONTHLY_AI: 1500,
  },
} as const;

// Feature flags
export const FEATURES = {
  AI_CHAT: true,
  AUTOPILOT: true,
  BOARD_EXPORT: true,
} as const;
