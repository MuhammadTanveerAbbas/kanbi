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

// Task priorities
export const TASK_PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'] as const;

// Task statuses
export const TASK_STATUSES = ['To Do', 'In Progress', 'Done'] as const;

// Toast duration
export const TOAST_DURATION = 3000; // ms

// API timeouts
export const API_TIMEOUT = 30000; // ms
export const FETCH_TIMEOUT = 15000; // ms

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// AI Models
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
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
