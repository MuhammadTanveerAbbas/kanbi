import { describe, it, expect } from 'vitest';
import { normalizeBriefingResponse, normalizeScheduleBlock } from '@/lib/autopilot/normalize';
import { generateDailySchedule, generateMorningBriefing } from '@/lib/ai/autopilot-engine';
import type { TimeBlock } from '@/lib/ai/autopilot-engine';

/**
 * The briefing endpoint returns schedule blocks shaped as
 * { start, end, task: Task, duration: number } where duration is minutes.
 * The dashboard previously read them as { time, task: string, duration: string },
 * so `task` arrived as an object and rendering it threw, which the error
 * boundary reported as "Something went wrong".
 *
 * These tests pin the wire shape to the shape the interface consumes so the
 * two cannot drift apart again.
 */

const task = (id: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') => ({
  id,
  title: `Task ${id}`,
  priority,
  status: 'todo',
});

const settings = {
  work_hours_start: '09:00',
  work_hours_end: '17:00',
  break_duration: 15,
  max_daily_tasks: 8,
};

describe('normalizeScheduleBlock', () => {
  it('reads a block shaped by the autopilot engine', () => {
    const block: TimeBlock = {
      start: '09:00',
      end: '10:00',
      task: task('a'),
      duration: 60,
    } as TimeBlock;

    expect(normalizeScheduleBlock(block)).toEqual({
      time: '09:00 - 10:00',
      task: 'Task a',
      duration: '1h',
    });
  });

  it('never returns an object for the task field', () => {
    // The original defect: an object here is rendered as a React child and throws.
    const result = normalizeScheduleBlock({ start: '09:00', end: '09:45', task: task('x'), duration: 45 });
    expect(typeof result.task).toBe('string');
    expect(typeof result.time).toBe('string');
    expect(typeof result.duration).toBe('string');
  });

  it('accepts a block that already uses the display shape', () => {
    expect(
      normalizeScheduleBlock({ time: '09:00', task: 'Already a string', duration: '30m' })
    ).toEqual({ time: '09:00', task: 'Already a string', duration: '30m' });
  });

  it('accepts the database row shape', () => {
    expect(
      normalizeScheduleBlock({
        time_block: '11:00-12:00',
        task_title: 'From the database',
        estimated_duration: 90,
      })
    ).toEqual({ time: '11:00 - 12:00', task: 'From the database', duration: '1h 30m' });
  });

  it('falls back to placeholders instead of producing undefined', () => {
    const result = normalizeScheduleBlock({});
    expect(result.time).toBe('Unscheduled');
    expect(result.task).toBe('Untitled task');
    expect(result.duration).toBe('30m');
  });

  it('formats minutes readably across ranges', () => {
    expect(normalizeScheduleBlock({ start: '09:00', end: '09:30', task: task('a'), duration: 30 }).duration).toBe('30m');
    expect(normalizeScheduleBlock({ start: '09:00', end: '10:00', task: task('a'), duration: 60 }).duration).toBe('1h');
    expect(normalizeScheduleBlock({ start: '09:00', end: '11:30', task: task('a'), duration: 150 }).duration).toBe('2h 30m');
  });

  it('tolerates a negative or zero duration', () => {
    expect(normalizeScheduleBlock({ duration: 0 }).duration).toBe('0m');
    expect(normalizeScheduleBlock({ duration: -5 }).duration).toBe('0m');
  });
});

describe('normalizeBriefingResponse', () => {
  const raw = {
    briefing: {
      summary: 'Good morning',
      priorities: [],
      warnings: ['One warning'],
      motivationalQuote: 'Keep going',
      schedule: [
        { start: '09:00', end: '10:00', task: task('a'), duration: 60 },
        { start: '10:15', end: '10:45', task: task('b'), duration: 30 },
      ],
    },
    schedule: [],
  };

  it('maps a nested briefing payload', () => {
    const result = normalizeBriefingResponse(raw);
    expect(result.summary).toBe('Good morning');
    expect(result.schedule).toHaveLength(2);
    expect(result.healthNote).toBe('One warning');
  });

  it('produces only renderable primitives', () => {
    const result = normalizeBriefingResponse(raw);
    for (const block of result.schedule) {
      expect(typeof block.time).toBe('string');
      expect(typeof block.task).toBe('string');
      expect(typeof block.duration).toBe('string');
    }
  });

  it('falls back to a top level schedule when briefing is absent', () => {
    const result = normalizeBriefingResponse({
      summary: 'Top level',
      schedule: [{ start: '09:00', end: '10:00', task: task('a'), duration: 60 }],
    });
    expect(result.summary).toBe('Top level');
    expect(result.schedule).toHaveLength(1);
  });

  it('supplies a summary rather than rendering undefined', () => {
    const result = normalizeBriefingResponse({});
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.healthNote.length).toBeGreaterThan(0);
  });

  it('never throws on a malformed payload', () => {
    for (const bad of [null, undefined, 'nonsense', 42, [], { schedule: 'x' }, { schedule: [null, 3] }]) {
      expect(() => normalizeBriefingResponse(bad as never)).not.toThrow();
    }
  });
});

describe('engine output feeds the normaliser', () => {
  it('normalises real engine output end to end', () => {
    // This is the exact production path: engine output straight into the page.
    const tasks = [task('a', 'urgent'), task('b', 'high'), task('c', 'low')];
    const schedule = generateDailySchedule(tasks, settings);
    const briefing = generateMorningBriefing(tasks, schedule, 80);

    const result = normalizeBriefingResponse({ briefing, schedule });
    expect(result.schedule.length).toBe(schedule.length);
    for (const block of result.schedule) {
      expect(typeof block.task).toBe('string');
      expect(block.task.length).toBeGreaterThan(0);
    }
  });
});
