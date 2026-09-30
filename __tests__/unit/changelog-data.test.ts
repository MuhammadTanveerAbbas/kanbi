import { describe, it, expect } from 'vitest';
import {
  CHANGELOG,
  KIND_META,
  formatReleaseDate,
  type ChangeKind,
} from '@/lib/changelog-data';

describe('changelog data', () => {
  it('has at least one release', () => {
    expect(CHANGELOG.length).toBeGreaterThan(0);
  });

  it('lists releases newest first', () => {
    const dates = CHANGELOG.map((r) => r.date);
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  });

  it('uses a valid semantic version for every release', () => {
    for (const release of CHANGELOG) {
      expect(release.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('uses a parseable ISO date for every release', () => {
    for (const release of CHANGELOG) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(`${release.date}T00:00:00Z`).getTime())).toBe(false);
    }
  });

  it('gives every release a summary', () => {
    for (const release of CHANGELOG) {
      expect(release.summary.length).toBeGreaterThan(0);
    }
  });

  it('uses only kinds that have presentational metadata', () => {
    const known = new Set(Object.keys(KIND_META));
    for (const release of CHANGELOG) {
      for (const change of release.changes) {
        expect(known.has(change.kind)).toBe(true);
      }
    }
  });

  it('has no duplicate entries within a release', () => {
    for (const release of CHANGELOG) {
      const texts = release.changes.map((c) => c.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  it('puts the most recent release first, since the page badges index 0 as latest', () => {
    // The "Latest" badge is derived from array position. If these ever disagree
    // the badge would land on the wrong version, so assert the invariant directly.
    const first = new Date(`${CHANGELOG[0]!.date}T00:00:00Z`).getTime();
    for (const release of CHANGELOG.slice(1)) {
      expect(new Date(`${release.date}T00:00:00Z`).getTime()).toBeLessThan(first);
    }
  });

  it('states plainly when a version has no recorded notes', () => {
    // A release with no changes must explain why in its summary, otherwise the
    // page would render a bare version heading with nothing under it.
    const empty = CHANGELOG.filter((r) => r.changes.length === 0);
    for (const release of empty) {
      expect(release.summary.toLowerCase()).toContain('no release notes');
    }
  });

  it('renders every recorded version, not only those with entries', () => {
    // The page lists all releases under the "Everything" filter, so the data
    // must carry every version from 0.1.0 onward with nothing dropped.
    const versions = CHANGELOG.map((r) => r.version);
    expect(versions).toContain('0.1.0');
    expect(versions).toContain('0.3.0');
    expect(versions).toContain('3.0.0');
    expect(versions).toContain('3.1.0');
    expect(versions[0]).toBe('3.2.0');
  });
});

describe('formatReleaseDate', () => {
  it('formats an ISO date in a stable, locale-independent way', () => {
    expect(formatReleaseDate('2026-09-30')).toBe('30 September 2026');
  });

  it('does not shift the day across time zones', () => {
    // Formatting in a local time zone would render this as the 29th west of UTC.
    expect(formatReleaseDate('2026-01-01')).toBe('1 January 2026');
  });

  it('returns the input unchanged when it cannot be parsed', () => {
    expect(formatReleaseDate('not a date')).toBe('not a date');
  });
});

describe('KIND_META', () => {
  it('has a label and colours for every kind', () => {
    const kinds: ChangeKind[] = ['added', 'fixed', 'changed', 'security', 'removed'];
    for (const kind of kinds) {
      expect(KIND_META[kind].label.length).toBeGreaterThan(0);
      expect(KIND_META[kind].color.length).toBeGreaterThan(0);
      expect(KIND_META[kind].bg.length).toBeGreaterThan(0);
    }
  });
});
