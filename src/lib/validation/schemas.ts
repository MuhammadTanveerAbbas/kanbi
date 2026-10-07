import { z } from 'zod';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  BOARD_TASK_PRIORITIES,
  BOARD_TASK_STATUSES,
} from '@/lib/constants';



export const analyzeWorkloadSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(TASK_STATUSES as unknown as [string, ...string[]]),
    priority: z.enum(TASK_PRIORITIES as unknown as [string, ...string[]]).optional(),
    dueDate: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.string().optional(),
  })),
  userCapacity: z.number().min(1).max(24).optional(),
});

/**
 * A single task as the client sends it when saving a board.
 *
 * This is the largest AI-shaped payload the app accepts, so it is validated
 * rather than passed through as `z.any()`. Every field is bounded because the
 * value is stored as JSON and later re-read for rendering and export.
 */
export const boardTaskSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().min(1, 'Task title is required').max(200),
  priority: z.enum(BOARD_TASK_PRIORITIES).catch('medium'),
  label: z.string().max(50).optional(),
  status: z.enum(BOARD_TASK_STATUSES).catch('todo'),
  dueDate: z.string().max(40).optional(),
  estimate: z.string().max(20).optional(),
});

/** A board cannot be arbitrarily large, so the task count is capped. */
export const MAX_TASKS_PER_BOARD = 500;

export const saveBoardSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  tasks: z.array(boardTaskSchema).max(MAX_TASKS_PER_BOARD, 'Too many tasks in one board'),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.string().max(50).optional(),
  icon: z.string().max(50).optional(),
});

/**
 * Input for the AI extraction endpoint.
 *
 * The text is trimmed before the length check so a whitespace-only payload is
 * rejected as empty rather than reaching the model.
 */
export const extractSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Text is required')
    .max(10_000, 'Text too long. Max 10,000 characters'),
});


export const trackCompletionSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  taskPriority: z.enum(['urgent', 'high', 'medium', 'low', 'Low', 'Medium', 'High', 'Urgent']),
  timeSpentMinutes: z.number().min(0),
});

export const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long. Max 2,000 characters'),
  tasks: z.array(z.any()).optional(),
});

/**
 * The streaming assistant endpoint.
 *
 * The history is sent by the client rather than read from the database, because
 * a stream that has already started cannot be given a different turn count
 * mid-flight, and because the client is the only party that knows what it has
 * already displayed. Bounded to a small number of turns for the same reason the
 * buffered path bounds it: the board context, not the transcript, is what the
 * answer depends on.
 */
export const chatStreamSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long. Max 2,000 characters'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      }),
    )
    .max(20, 'Too much conversation history')
    .default([]),
});

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other', 'general']),
  message: z.string().min(1).max(1000),
  email: z.string().email().optional(),
});


