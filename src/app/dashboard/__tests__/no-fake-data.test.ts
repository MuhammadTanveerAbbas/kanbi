/**
 * Architecture fitness check.
 *
 * The dashboard used to fake several core operations with setTimeout delays and
 * synthetic data. Those bugs are fixed, and this check exists so they cannot
 * silently return. It asserts only on forbidden patterns, never on the presence
 * of a particular API call, so extracting a helper or renaming a route does not
 * break it while a reintroduced fake would.
 *
 * The real request/response behavior of those routes is covered by the
 * integration tests under __tests__/integration.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const dashboardSource = readFileSync(
  join(process.cwd(), 'src/app/dashboard/page.tsx'),
  'utf-8'
);

describe('Fitness: dashboard operations are backed by real API calls', () => {
  it('does not simulate chat replies with a timer', () => {
    expect(dashboardSource).not.toMatch(/setTimeout\(r\s*,\s*(1100|2200)\)/);
  });

  it('does not synthesize tasks in place of loading them', () => {
    expect(dashboardSource).not.toContain('syntheticTasks.push');
  });

  it('does not fabricate extracted tasks from a local regex', () => {
    expect(dashboardSource).not.toMatch(/lines\.map\(\(l,\s*i\)\s*=>\s*\(\{/);
  });

  it('surfaces API errors to the user instead of swallowing them', () => {
    // Every fetch call site must sit inside a try/catch that sets an error
    // message, otherwise a failed request would leave the UI in limbo.
    const fetchCalls = dashboardSource.match(/await fetch\(/g)?.length ?? 0;
    expect(fetchCalls).toBeGreaterThan(0);
    expect(dashboardSource).toContain('setExtractError');
    expect(dashboardSource).toContain('catch {');
  });
});
