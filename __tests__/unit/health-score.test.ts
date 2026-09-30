import { describe, it, expect } from 'vitest';
import {
  computeBoardHealthScore,
  healthBand,
  healthMessage,
} from '@/lib/workload/health-score';

const t = (priority?: string) => ({ priority });

describe('computeBoardHealthScore', () => {
  it('scores an empty board as healthy', () => {
    // An empty board is not overloaded, so it must not show as a problem.
    expect(computeBoardHealthScore([])).toBe(100);
  });

  it('scores a board of only low-priority tasks as healthy', () => {
    expect(computeBoardHealthScore([t('low'), t('low'), t('low'), t('low')])).toBe(100);
  });

  it('scores a board of only urgent tasks at the floor of 58', () => {
    // Every task is demanding, so the full 42 point deduction applies.
    expect(computeBoardHealthScore([t('urgent'), t('urgent')])).toBe(58);
  });

  it('never returns a negative score', () => {
    const many = Array.from({ length: 50 }, () => t('urgent'));
    expect(computeBoardHealthScore(many)).toBeGreaterThanOrEqual(0);
  });

  it('is case insensitive for priority values', () => {
    expect(computeBoardHealthScore([t('Urgent')])).toBe(58);
    expect(computeBoardHealthScore([t('HIGH')])).toBe(58);
  });

  it('ignores medium and low priorities when computing the deduction', () => {
    const withMedium = computeBoardHealthScore([t('high'), t('medium'), t('low'), t('low')]);
    const withoutMedium = computeBoardHealthScore([t('high'), t('urgent')]);
    expect(withMedium).toBeGreaterThan(withoutMedium);
  });

  it('treats a missing priority as non demanding', () => {
    expect(computeBoardHealthScore([{}, {}])).toBe(100);
  });

  it('produces a whole number', () => {
    const score = computeBoardHealthScore([t('high'), t('low'), t('low')]);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('decreases monotonically as the share of demanding tasks rises', () => {
    const scores = [
      computeBoardHealthScore([t('low'), t('low'), t('low'), t('low')]),
      computeBoardHealthScore([t('high'), t('low'), t('low'), t('low')]),
      computeBoardHealthScore([t('high'), t('high'), t('low'), t('low')]),
      computeBoardHealthScore([t('high'), t('high'), t('high'), t('low')]),
      computeBoardHealthScore([t('high'), t('high'), t('high'), t('high')]),
    ];
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]!).toBeLessThanOrEqual(scores[i - 1]!);
    }
  });

  it('is deterministic for the same board', () => {
    const board = [t('high'), t('medium'), t('low')];
    expect(computeBoardHealthScore(board)).toBe(computeBoardHealthScore(board));
  });
});

describe('healthBand', () => {
  it.each([
    [100, 'healthy'],
    [75, 'healthy'],
    [74, 'moderate'],
    [50, 'moderate'],
    [49, 'overloaded'],
    [0, 'overloaded'],
  ] as const)('maps %i to %s', (score, expected) => {
    expect(healthBand(score)).toBe(expected);
  });
});

describe('healthMessage', () => {
  it('gives a distinct message for each band', () => {
    const messages = new Set([
      healthMessage(90),
      healthMessage(60),
      healthMessage(20),
    ]);
    expect(messages.size).toBe(3);
  });

  it('does not promise recovery or certainty', () => {
    // The message must stay descriptive, since the score is a heuristic.
    expect(healthMessage(20)).toBe('Overloaded, consider deferring tasks.');
  });
});
