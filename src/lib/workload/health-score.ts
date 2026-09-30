/**
 * Board health score.
 *
 * The health score shown to the user must have exactly one definition. It was
 * previously written inline in two separate dashboard components, so the two
 * could drift apart and neither had a test.
 *
 * This is a pure function with no server-only dependencies so the dashboard can
 * import it directly. It is intentionally not the same metric as the server
 * side capacity model in WorkloadAnalyzer, which estimates hours against a daily
 * capacity for the detailed analysis view. See LIMITATIONS in the README.
 */

/** The minimum board priority treated as demanding attention. */
const HIGH_PRIORITIES = new Set(['urgent', 'high']);

/** Points deducted when every task on the board is high or urgent priority. */
const MAX_DEDUCTION = 42;

export interface HealthScoreInput {
  priority?: string | null;
}

/**
 * Scores a board from 0 to 100 based on the share of high or urgent tasks.
 *
 * A board with no tasks scores 100, since an empty board is not overloaded.
 */
export function computeBoardHealthScore(tasks: HealthScoreInput[]): number {
  if (tasks.length === 0) return 100;

  const demanding = tasks.filter((task) =>
    HIGH_PRIORITIES.has((task.priority ?? '').toLowerCase())
  ).length;

  const deduction = (demanding / tasks.length) * MAX_DEDUCTION;
  return Math.round(Math.max(0, 100 - deduction));
}

/** Bucket used for the health badge and the accompanying message. */
export type HealthBand = 'healthy' | 'moderate' | 'overloaded';

export function healthBand(score: number): HealthBand {
  if (score >= 75) return 'healthy';
  if (score >= 50) return 'moderate';
  return 'overloaded';
}

/** Short, user-facing explanation of the current band. */
export function healthMessage(score: number): string {
  switch (healthBand(score)) {
    case 'healthy':
      return 'Workload is balanced and healthy.';
    case 'moderate':
      return 'Some high-priority tasks need attention.';
    case 'overloaded':
      return 'Overloaded, consider deferring tasks.';
  }
}
