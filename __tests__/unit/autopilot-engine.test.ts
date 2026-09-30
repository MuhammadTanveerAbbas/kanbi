import { describe, it, expect } from 'vitest';
import {
  parseEstimate,
  estimateTaskDuration,
  autoPrioritizeTasks,
  generateDailySchedule,
  generateMorningBriefing,
  detectBlockersAndAdjust,
  rescheduleOverflow,
  type AutopilotTask,
  type AutopilotSettings,
} from '@/lib/ai/autopilot-engine';

const task = (over: Partial<AutopilotTask> = {}): AutopilotTask => ({
  id: 't1',
  title: 'A task',
  priority: 'medium',
  status: 'todo',
  ...over,
});

const settings: AutopilotSettings = {
  work_hours_start: '09:00',
  work_hours_end: '17:00',
  break_duration: 15,
  max_daily_tasks: 8,
};

describe('parseEstimate', () => {
  it.each([
    ['1h', 60],
    ['90m', 90],
    ['30 min', 30],
    ['2 hours', 120],
    ['1h 30m', 90],
    ['45', 45],
    ['1.5h', 90],
  ])('parses %s', (input, expected) => {
    expect(parseEstimate(input)).toBe(expected);
  });

  it('returns null for values it cannot understand', () => {
    for (const bad of ['', '   ', 'soon', 'later', null, undefined, 'abc']) {
      expect(parseEstimate(bad as never)).toBeNull();
    }
  });

  it('rejects zero and negative values', () => {
    expect(parseEstimate('0m')).toBeNull();
    expect(parseEstimate('-30m')).toBeNull();
  });

  it('caps an absurdly long block so one task cannot eat the day', () => {
    expect(parseEstimate('10h')).toBe(180);
  });
});

describe('estimateTaskDuration', () => {
  it('uses a user supplied estimate over the priority default', () => {
    // The dashboard sends an estimate string, so it must be honoured.
    expect(estimateTaskDuration(task({ priority: 'urgent', estimate: '2h' }))).toBe(120);
  });

  it('prefers a measured duration when one exists', () => {
    expect(estimateTaskDuration(task({ estimatedTime: 25, estimate: '3h' }))).toBe(25);
  });

  it('falls back to the priority default when no estimate is given', () => {
    expect(estimateTaskDuration(task({ priority: 'urgent' }))).toBe(45);
    expect(estimateTaskDuration(task({ priority: 'low' }))).toBe(120);
  });

  it('falls back when the estimate cannot be parsed', () => {
    expect(estimateTaskDuration(task({ priority: 'high', estimate: 'whenever' }))).toBe(60);
  });

  it('never returns zero or a negative duration', () => {
    expect(estimateTaskDuration(task({ estimatedTime: 0 }))).toBeGreaterThan(0);
    expect(estimateTaskDuration(task({ estimatedTime: -10 }))).toBeGreaterThan(0);
  });
});

describe('autoPrioritizeTasks', () => {
  it('orders urgent first and low last', () => {
    const result = autoPrioritizeTasks([
      task({ id: 'l', priority: 'low' }),
      task({ id: 'u', priority: 'urgent' }),
      task({ id: 'm', priority: 'medium' }),
      task({ id: 'h', priority: 'high' }),
    ]);
    expect(result.map((t) => t.id)).toEqual(['u', 'h', 'm', 'l']);
  });

  it('places the larger task first within the same priority', () => {
    const result = autoPrioritizeTasks([
      task({ id: 'small', priority: 'high', estimate: '20m' }),
      task({ id: 'big', priority: 'high', estimate: '2h' }),
    ]);
    expect(result.map((t) => t.id)).toEqual(['big', 'small']);
  });

  it('does not mutate the input array', () => {
    const input = [task({ id: 'l', priority: 'low' }), task({ id: 'u', priority: 'urgent' })];
    const before = input.map((t) => t.id);
    autoPrioritizeTasks(input);
    expect(input.map((t) => t.id)).toEqual(before);
  });

  it('is stable across runs', () => {
    const input = [
      task({ id: 'a', priority: 'high' }),
      task({ id: 'b', priority: 'high' }),
      task({ id: 'c', priority: 'high' }),
    ];
    const first = autoPrioritizeTasks(input).map((t) => t.id);
    const second = autoPrioritizeTasks([...input]).map((t) => t.id);
    expect(first).toEqual(second);
  });
});

describe('generateDailySchedule', () => {
  it('schedules tasks inside working hours', () => {
    const schedule = generateDailySchedule(
      [task({ id: 'a', estimate: '1h' }), task({ id: 'b', estimate: '1h' })],
      settings
    );
    expect(schedule).toHaveLength(2);
    expect(schedule[0]!.start).toBe('09:00');
    expect(schedule[0]!.end).toBe('10:00');
    // A 15 minute break sits between the two blocks.
    expect(schedule[1]!.start).toBe('10:15');
  });

  it('does not place a break before the first block', () => {
    const schedule = generateDailySchedule([task({ estimate: '30m' })], settings);
    expect(schedule[0]!.start).toBe('09:00');
  });

  it('skips a task that does not fit rather than truncating it', () => {
    const schedule = generateDailySchedule(
      [task({ id: 'fits', estimate: '30m' }), task({ id: 'huge', estimate: '3h' })],
      { ...settings, work_hours_end: '10:00' }
    );
    expect(schedule.map((b) => b.task.id)).toEqual(['fits']);
    // The skipped task must keep a valid, complete block rather than a partial one.
    expect(schedule[0]!.end).toBe('09:30');
  });

  it('never schedules past the end of the working day', () => {
    const many = Array.from({ length: 20 }, (_, i) => task({ id: `t${i}`, estimate: '1h' }));
    const schedule = generateDailySchedule(many, { ...settings, work_hours_end: '12:00' });
    for (const block of schedule) {
      expect(block.end <= '12:00').toBe(true);
    }
  });

  it('respects the maximum number of tasks per day', () => {
    const many = Array.from({ length: 20 }, (_, i) => task({ id: `t${i}`, estimate: '15m' }));
    const schedule = generateDailySchedule(many, { ...settings, max_daily_tasks: 3 });
    expect(schedule).toHaveLength(3);
  });

  it('excludes completed tasks', () => {
    const schedule = generateDailySchedule(
      [task({ id: 'done', status: 'done' }), task({ id: 'open', status: 'todo' })],
      settings
    );
    expect(schedule.map((b) => b.task.id)).toEqual(['open']);
  });

  it('returns nothing for invalid working hours', () => {
    expect(generateDailySchedule([task()], { ...settings, work_hours_end: '08:00' })).toEqual([]);
  });

  it('tolerates malformed settings without throwing', () => {
    const bad = { work_hours_start: 'nonsense', work_hours_end: '??', break_duration: NaN, max_daily_tasks: NaN };
    expect(() => generateDailySchedule([task()], bad)).not.toThrow();
  });

  it('handles an empty board', () => {
    expect(generateDailySchedule([], settings)).toEqual([]);
  });

  it('is deterministic', () => {
    const input = [task({ id: 'a', priority: 'urgent' }), task({ id: 'b', priority: 'low' })];
    const a = generateDailySchedule(input, settings);
    const b = generateDailySchedule([...input], settings);
    expect(a).toEqual(b);
  });

  it('formats clock times with a leading zero', () => {
    const schedule = generateDailySchedule([task({ estimate: '90m' })], settings);
    expect(schedule[0]!.start).toBe('09:00');
    expect(schedule[0]!.end).toBe('10:30');
  });
});

describe('generateMorningBriefing', () => {
  const tasks = [
    task({ id: 'a', priority: 'urgent', estimate: '1h' }),
    task({ id: 'b', priority: 'high', estimate: '1h' }),
  ];
  const schedule = generateDailySchedule(tasks, settings);

  it('summarises the day', () => {
    const briefing = generateMorningBriefing(tasks, schedule, 80);
    expect(briefing.summary).toContain('2 of 2');
    expect(briefing.summary).toContain('urgent');
  });

  it('returns the same quote for the same day rather than a random one', () => {
    const first = generateMorningBriefing(tasks, schedule, 80).motivationalQuote;
    const second = generateMorningBriefing(tasks, schedule, 80).motivationalQuote;
    expect(first).toBe(second);
  });

  it('warns when urgent tasks are competing', () => {
    const many = Array.from({ length: 5 }, (_, i) => task({ id: `u${i}`, priority: 'urgent' }));
    const briefing = generateMorningBriefing(many, generateDailySchedule(many, settings), 80);
    expect(briefing.warnings.join(' ')).toContain('urgent');
  });

  it('warns when tasks did not fit in the day', () => {
    const many = Array.from({ length: 20 }, (_, i) => task({ id: `t${i}`, estimate: '1h' }));
    const briefing = generateMorningBriefing(
      many,
      generateDailySchedule(many, { ...settings, max_daily_tasks: 2 }),
      80
    );
    expect(briefing.warnings.join(' ')).toMatch(/not fit|does not fit/);
  });

  it('warns when a heavy board is reported', () => {
    const briefing = generateMorningBriefing(tasks, schedule, 20);
    expect(briefing.warnings.join(' ')).toContain('High workload');
  });

  it('handles a clear board without inventing work', () => {
    const briefing = generateMorningBriefing([], [], 100);
    expect(briefing.summary).toContain('clear');
    expect(briefing.priorities).toEqual([]);
  });

  it('gives each priority a reason', () => {
    const briefing = generateMorningBriefing(tasks, schedule, 80);
    for (const p of briefing.priorities) {
      expect(p.reason.length).toBeGreaterThan(0);
      expect(p.task.length).toBeGreaterThan(0);
    }
  });

  it('tolerates malformed input', () => {
    expect(() => generateMorningBriefing(null as never, null as never, NaN)).not.toThrow();
  });
});

describe('detectBlockersAndAdjust', () => {
  it('flags too many urgent tasks', () => {
    const many = Array.from({ length: 7 }, (_, i) => task({ id: `u${i}`, priority: 'urgent' }));
    const adjustments = detectBlockersAndAdjust(many, []);
    expect(adjustments.some((a) => a.type === 'reprioritize')).toBe(true);
  });

  it('flags a block longer than two hours', () => {
    const long = generateDailySchedule([task({ estimate: '3h' })], settings);
    const adjustments = detectBlockersAndAdjust([task({ estimate: '3h' })], long);
    expect(adjustments.some((a) => a.type === 'break_down')).toBe(true);
  });

  it('says nothing about a well formed day', () => {
    const input = [task({ id: 'a', estimate: '45m' }), task({ id: 'b', estimate: '45m' })];
    const adjustments = detectBlockersAndAdjust(input, generateDailySchedule(input, settings));
    expect(adjustments).toEqual([]);
  });

  it('returns empty for empty input', () => {
    expect(detectBlockersAndAdjust([], [])).toEqual([]);
  });
});

describe('rescheduleOverflow', () => {
  it('returns the tasks that were not scheduled', () => {
    const all = [task({ id: 'a' }), task({ id: 'b' })];
    const overflow = rescheduleOverflow(all, [all[0]!]);
    expect(overflow.map((t) => t.id)).toEqual(['b']);
  });

  it('excludes completed tasks', () => {
    const overflow = rescheduleOverflow([task({ id: 'a', status: 'done' })], []);
    expect(overflow).toEqual([]);
  });

  it('orders the overflow so the least important is moved first', () => {
    const overflow = rescheduleOverflow(
      [task({ id: 'u', priority: 'urgent' }), task({ id: 'l', priority: 'low' })],
      []
    );
    expect(overflow.map((t) => t.id)).toEqual(['l', 'u']);
  });
});
