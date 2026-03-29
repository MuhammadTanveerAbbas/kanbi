/**
 * Bug Condition Exploration Test
 *
 * Static code analysis tests that read the actual source of page.tsx and assert
 * the presence of mock patterns (confirming bugs) and absence of real API calls.
 *
 * These tests MUST FAIL on unfixed code kanbi failure confirms the bugs exist.
 * They will PASS after the fixes are implemented.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const dashboardSource = readFileSync(
  join(process.cwd(), 'src/app/dashboard/page.tsx'),
  'utf-8'
);

describe('Bug Condition Exploration: Mock Implementations Override Real API Calls', () => {
  // Test 1: AI Chat should use /api/ai/chat not setTimeout
  it('AI Chat: Should call /api/ai/chat instead of using setTimeout mock', () => {
    // EXPECTED BEHAVIOR (fixed): real fetch to /api/ai/chat
    expect(dashboardSource).toContain("fetch('/api/ai/chat'");
    // BUG CONDITION (unfixed): setTimeout mock is used
    expect(dashboardSource).not.toContain("await new Promise(r => setTimeout(r, 1100))");
  });

  // Test 2: Task Extraction should use /api/extract not regex
  it('Task Extraction: Should call /api/extract instead of using regex mock', () => {
    expect(dashboardSource).toContain("fetch('/api/extract'");
    expect(dashboardSource).not.toContain('lines.map((l, i) => ({');
  });

  // Test 3: Task Loading should use /api/boards not synthetic data
  it('Task Loading: Should call /api/boards instead of generating synthetic data', () => {
    expect(dashboardSource).toContain("fetch('/api/boards'");
    expect(dashboardSource).not.toContain('syntheticTasks.push({ id:`u${i}`');
  });

  // Test 4: Autopilot Briefing should use /api/autopilot/briefing not setTimeout
  it('Autopilot Briefing: Should call /api/autopilot/briefing instead of using setTimeout mock', () => {
    expect(dashboardSource).toContain("fetch('/api/autopilot/briefing'");
    expect(dashboardSource).not.toContain("await new Promise(r => setTimeout(r, 2200))");
  });

  // Test 5: Analytics Sync should call /api/sync-task-stats after task operations
  it('Analytics Sync: Should call /api/sync-task-stats after task operations', () => {
    expect(dashboardSource).toContain("fetch('/api/sync-task-stats'");
  });

  // Combined test
  it('Combined: All 5 operations should use real API calls instead of mocks', () => {
    expect(dashboardSource).toContain("fetch('/api/ai/chat'");
    expect(dashboardSource).toContain("fetch('/api/extract'");
    expect(dashboardSource).toContain("fetch('/api/boards'");
    expect(dashboardSource).toContain("fetch('/api/autopilot/briefing'");
    expect(dashboardSource).toContain("fetch('/api/sync-task-stats'");

    expect(dashboardSource).not.toContain("await new Promise(r => setTimeout(r, 1100))");
    expect(dashboardSource).not.toContain('lines.map((l, i) => ({');
    expect(dashboardSource).not.toContain('syntheticTasks.push({ id:`u${i}`');
    expect(dashboardSource).not.toContain("await new Promise(r => setTimeout(r, 2200))");
  });
});
