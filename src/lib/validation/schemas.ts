import { z } from 'zod';

export const parseTasksSchema = z.object({
  notes: z.string().min(1, 'Notes are required').max(10000, 'Notes too long. Max 10,000 characters'),
});

export const generateSchema = z.object({
  input: z.string().min(1, 'Input text is required'),
  tone: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  format: z.enum(['text', 'markdown', 'json', 'html']).optional(),
  model: z.string().optional(),
});

export const analyzeWorkloadSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(['todo', 'wip', 'done', 'To Do', 'In Progress', 'Done']),
    priority: z.enum(['urgent', 'high', 'medium', 'low', 'Low', 'Medium', 'High', 'Urgent']).optional(),
    dueDate: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.string().optional(),
  })),
  userCapacity: z.number().min(1).max(24).optional(),
});

export const saveBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  tasks: z.array(z.any()),
  tags: z.array(z.string()).optional(),
});

export const createSavedGenerationSchema = z.object({
  input_text: z.string().min(1, 'Input text is required'),
  output_text: z.string().min(1, 'Output text is required'),
  tone: z.string().optional(),
  length: z.string().optional(),
  format: z.string().optional(),
  title: z.string().optional(),
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

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other', 'general']),
  message: z.string().min(1).max(1000),
  email: z.string().email().optional(),
});

export const parseEmailSchema = z.object({
  emailContent: z.string().min(1, 'Email content is required'),
});

export const parseUrlSchema = z.object({
  url: z.string().url('Invalid URL'),
});
