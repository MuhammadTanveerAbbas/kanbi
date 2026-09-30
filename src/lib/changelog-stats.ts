/**
 * Numbers shown on the changelog page.
 *
 * Everything here is measured, not estimated.
 *
 * `PROJECT_HISTORY` was produced by walking the Git history and reading the tree
 * as it stood at the last commit of each month. The exact commands are recorded
 * below so any reader can reproduce the table.
 *
 *   git log --format=%ad --date=format:%Y-%m
 *   git rev-list -1 --before="YYYY-MM-31 23:59" HEAD
 *   git ls-tree -r --name-only <commit>
 *   git show <commit>:package.json
 *
 * `PROJECT_NOW` was measured against the working tree after this release was
 * prepared.
 *
 * Two of the series fall over the last two rows, and that is deliberate. The API
 * route count drops because nine routes that could never have worked were
 * removed. They had no callers and each one returned made up or empty data. A
 * smaller number of routes is the better outcome.
 */

export interface HistoryPoint {
  /** Year and month, for example `2026-03`. */
  month: string;
  /** Commits authored in that calendar month. */
  commits: number;
  /** TypeScript and JavaScript files under `src`. */
  sourceFiles: number;
  /** Files under `src/app/api` that export an HTTP route handler. */
  apiRoutes: number;
  /** Files whose name marks them as an automated test. */
  testFiles: number;
}

/**
 * End of month snapshots taken from the repository.
 *
 * The first three months predate `src`, so the source counts there describe a
 * different layout and are kept only so the first data point is not invented.
 */
export const PROJECT_HISTORY: HistoryPoint[] = [
  { month: '2025-09', commits: 8, sourceFiles: 67, apiRoutes: 0, testFiles: 0 },
  { month: '2025-10', commits: 0, sourceFiles: 67, apiRoutes: 0, testFiles: 0 },
  { month: '2025-11', commits: 3, sourceFiles: 90, apiRoutes: 0, testFiles: 0 },
  { month: '2025-12', commits: 7, sourceFiles: 49, apiRoutes: 2, testFiles: 0 },
  { month: '2026-01', commits: 5, sourceFiles: 118, apiRoutes: 21, testFiles: 0 },
  { month: '2026-02', commits: 1, sourceFiles: 118, apiRoutes: 21, testFiles: 0 },
  { month: '2026-03', commits: 37, sourceFiles: 146, apiRoutes: 36, testFiles: 10 },
  { month: '2026-04', commits: 9, sourceFiles: 151, apiRoutes: 37, testFiles: 10 },
  { month: '2026-05', commits: 4, sourceFiles: 153, apiRoutes: 38, testFiles: 10 },
  { month: '2026-06', commits: 0, sourceFiles: 153, apiRoutes: 38, testFiles: 10 },
  { month: '2026-07', commits: 5, sourceFiles: 111, apiRoutes: 32, testFiles: 10 },
  { month: '2026-08', commits: 3, sourceFiles: 113, apiRoutes: 32, testFiles: 13 },
  { month: '2026-09', commits: 1, sourceFiles: 115, apiRoutes: 32, testFiles: 13 },
]

/** Measured against the working tree once this release was finished. */
export const PROJECT_NOW = {
  /** Total commits reachable from the branch head. */
  commits: 83,
  /** Files under `src`, excluding generated type declarations. */
  sourceFiles: 117,
  /** Lines of code under `src`. */
  sourceLines: 16062,
  /** Live route handlers under `src/app/api`. */
  apiRoutes: 23,
  /** Automated test files. */
  testFiles: 23,
  /** Assertions across the test suite. */
  assertions: 384,
  /** Runtime dependencies. */
  dependencies: 35,
  /** Build and test dependencies. */
  devDependencies: 18,
} as const

/**
 * The history series with the current working tree appended as a final point.
 *
 * The label is `now` rather than a month, because these changes have not been
 * released yet. Drawing them as a month would put a future date on a chart.
 *
 * Only use this for series that are snapshots. `commits` is a per month count,
 * so appending a cumulative total of 83 beside monthly values would draw a bar
 * that is three times taller than any real month and mean nothing.
 */
export function historyWithNow(): HistoryPoint[] {
  return [
    ...PROJECT_HISTORY,
    {
      month: 'now',
      // Deliberately zero. The month of this release is not in the history yet,
      // and inventing a number for it would put a fiction on a chart.
      commits: 0,
      sourceFiles: PROJECT_NOW.sourceFiles,
      apiRoutes: PROJECT_NOW.apiRoutes,
      testFiles: PROJECT_NOW.testFiles,
    },
  ]
}

/**
 * Monthly commit counts only.
 *
 * The bar chart uses this rather than `historyWithNow` because the unreleased
 * point is a running total and is not comparable to a month.
 */
export function monthlyCommits(): HistoryPoint[] {
  return PROJECT_HISTORY
}

/**
 * Months with no commits, which are real.
 *
 * Three months have a zero. Hiding them would draw a smoother and more
 * flattering line than the project actually earned, so the chart shows them.
 */
export function totalCommits(): number {
  return PROJECT_HISTORY.reduce((sum, point) => sum + point.commits, 0)
}

/** The busiest month in the recorded history, used for the chart callout. */
export function busiestMonth(): HistoryPoint {
  return PROJECT_HISTORY.reduce((best, point) =>
    point.commits > best.commits ? point : best
  )
}

/** Months with no commits at all. */
export function quietMonths(): HistoryPoint[] {
  return PROJECT_HISTORY.filter((point) => point.commits === 0)
}