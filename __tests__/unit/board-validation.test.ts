import { describe, it, expect } from 'vitest';
import {
  saveBoardSchema,
  boardTaskSchema,
  extractSchema,
  MAX_TASKS_PER_BOARD,
} from '@/lib/validation/schemas';

const validTask = {
  id: 't1',
  title: 'Review client proposal',
  priority: 'high',
  label: 'Client',
  status: 'todo',
  dueDate: '2026-10-01',
  estimate: '1h',
};

describe('extractSchema', () => {
  it('accepts ordinary text', () => {
    expect(extractSchema.parse({ text: 'Buy milk' })).toEqual({ text: 'Buy milk' });
  });

  it('rejects whitespace-only text as empty', () => {
    // Without trimming first, a blank string would pass a length check and then
    // reach the model as an empty prompt.
    expect(extractSchema.safeParse({ text: '   ' }).success).toBe(false);
    expect(extractSchema.safeParse({ text: '\n\t ' }).success).toBe(false);
  });

  it('trims surrounding whitespace from accepted text', () => {
    expect(extractSchema.parse({ text: '  Buy milk  ' })).toEqual({ text: 'Buy milk' });
  });

  it('rejects text over the length limit', () => {
    expect(extractSchema.safeParse({ text: 'a'.repeat(10_001) }).success).toBe(false);
  });

  it('accepts text at exactly the length limit', () => {
    expect(extractSchema.safeParse({ text: 'a'.repeat(10_000) }).success).toBe(true);
  });

  it('rejects a missing or non-string text field', () => {
    expect(extractSchema.safeParse({}).success).toBe(false);
    expect(extractSchema.safeParse({ text: 42 }).success).toBe(false);
    expect(extractSchema.safeParse(null).success).toBe(false);
  });
});

describe('boardTaskSchema', () => {
  it('accepts a well formed task', () => {
    expect(boardTaskSchema.parse(validTask)).toMatchObject({ title: 'Review client proposal' });
  });

  it('rejects a task with no title', () => {
    expect(boardTaskSchema.safeParse({ ...validTask, title: '' }).success).toBe(false);
  });

  it('rejects a title over the length limit', () => {
    expect(boardTaskSchema.safeParse({ ...validTask, title: 'a'.repeat(201) }).success).toBe(false);
  });

  it('falls back to medium priority for an unknown value', () => {
    // A bad enum value from the client should not reject the whole board.
    expect(boardTaskSchema.parse({ ...validTask, priority: 'catastrophic' }).priority).toBe('medium');
  });

  it('falls back to todo status for an unknown value', () => {
    expect(boardTaskSchema.parse({ ...validTask, status: 'archived' }).status).toBe('todo');
  });

  it('rejects an oversized id', () => {
    expect(boardTaskSchema.safeParse({ ...validTask, id: 'a'.repeat(101) }).success).toBe(false);
  });

  it('rejects an oversized estimate', () => {
    expect(boardTaskSchema.safeParse({ ...validTask, estimate: 'a'.repeat(21) }).success).toBe(false);
  });
});

describe('saveBoardSchema', () => {
  it('accepts a board with valid tasks', () => {
    const parsed = saveBoardSchema.parse({
      title: 'Sprint 1',
      tasks: [validTask],
      category: 'personal',
      icon: 'board',
    });
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.category).toBe('personal');
  });

  it('rejects a whitespace-only title', () => {
    expect(
      saveBoardSchema.safeParse({ title: '   ', tasks: [validTask] }).success
    ).toBe(false);
  });

  it('rejects a task with no title', () => {
    // This is the case the previous z.any() task array accepted unchecked.
    expect(
      saveBoardSchema.safeParse({ title: 'Board', tasks: [{ priority: 'high' }] }).success
    ).toBe(false);
  });

  it('rejects a non-array tasks field', () => {
    expect(saveBoardSchema.safeParse({ title: 'Board', tasks: 'not an array' }).success).toBe(false);
  });

  it('rejects more tasks than the per-board cap', () => {
    const tasks = Array.from({ length: MAX_TASKS_PER_BOARD + 1 }, (_, i) => ({
      ...validTask,
      id: `t${i}`,
    }));
    expect(saveBoardSchema.safeParse({ title: 'Board', tasks }).success).toBe(false);
  });

  it('accepts a board at exactly the task cap', () => {
    const tasks = Array.from({ length: MAX_TASKS_PER_BOARD }, (_, i) => ({
      ...validTask,
      id: `t${i}`,
    }));
    expect(saveBoardSchema.safeParse({ title: 'Board', tasks }).success).toBe(true);
  });

  it('rejects too many tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    expect(saveBoardSchema.safeParse({ title: 'Board', tasks: [], tags }).success).toBe(false);
  });

  it('accepts a board with no tasks', () => {
    expect(saveBoardSchema.parse({ title: 'Empty board', tasks: [] })).toMatchObject({
      title: 'Empty board',
      tasks: [],
    });
  });
});
