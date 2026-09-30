'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CHANGELOG,
  KIND_META,
  formatReleaseDate,
  type ChangeKind,
} from '@/lib/changelog-data'
import { TECH_STACK } from '@/components/brand-icons'
import { ReleaseCharts } from '@/components/changelog/Charts'
import { startThemeWatch, themeVars, useTheme } from '@/lib/theme'

/**
 * Public changelog.
 *
 * This page deliberately shows less than `CHANGELOG.md`. The repository file is
 * the engineering record and names the weaknesses that were fixed, because that
 * is useful to the person running the code. This page is for visitors, so it
 * describes what changed and what is better now. Neither page is generated from
 * the other by hand, so they cannot drift.
 *
 * It follows the site theme, keyed on the same `kanbi-theme` entry as the
 * landing and pricing pages, and falls back to the operating system preference.
 * Before this rewrite it was dark only, which meant a visitor who chose the
 * light theme anywhere else on the site hit a black page here.
 */

type Theme = 'dark' | 'light'

const FILTERS: Array<{ key: ChangeKind | 'all'; label: string }> = [
  { key: 'all', label: 'Everything' },
  { key: 'added', label: 'Added' },
  { key: 'fixed', label: 'Fixed' },
  { key: 'security', label: 'Security' },
  { key: 'changed', label: 'Changed' },
  { key: 'removed', label: 'Removed' },
]

function countByKind(): Record<string, number> {
  const counts: Record<string, number> = { all: 0 }
  for (const release of CHANGELOG) {
    for (const change of release.changes) {
      counts.all = (counts.all ?? 0) + 1
      counts[change.kind] = (counts[change.kind] ?? 0) + 1
    }
  }
  return counts
}

export default function ChangelogPage() {
  const [filter, setFilter] = useState<ChangeKind | 'all'>('all')
  const { theme, toggle } = useTheme()

  // One listener setup for the system preference and for other browser tabs,
  // both owned by the shared theme store.
  useEffect(() => startThemeWatch(), [])

  const counts = useMemo(() => countByKind(), [])
  const latest = CHANGELOG[0]
  const totalChanges = counts.all ?? 0

  return (
    <div className="cl-page" data-theme={theme}>
      <style>{`
        .cl-page {
          ${themeVars(theme)}
          --ac: #5e6fe8;
          --ach: #6e7ff8;
          --as: rgba(94, 111, 232, 0.12);
          --gr: #22c55e;
          --am: #f59e0b;
          min-height: 100vh;
          background: var(--bg);
          color: var(--tx);
          font-family: var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .cl-page *, .cl-page *::before, .cl-page *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* The shell caps width and centres it, so the charts, the timeline, and
           the tables all line up on one set of edges at every viewport. */
        .wrap {
          width: 100%;
          max-width: 940px;
          margin: 0 auto;
          padding: 28px 24px 88px;
        }

        /* ── Header ── */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 40px;
        }
        .back, .theme-toggle {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border: 1px solid var(--br);
          background: var(--bg2);
          color: var(--tx2);
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.18s ease, color 0.18s ease;
          white-space: nowrap;
        }
        .back:hover, .theme-toggle:hover {
          border-color: var(--brh);
          color: var(--tx);
        }
        .theme-toggle:focus-visible, .back:focus-visible, .filter:focus-visible,
        .table-toggle:focus-visible, .hit:focus-visible {
          outline: 2px solid var(--ac);
          outline-offset: 2px;
        }

        h1 {
          font-size: clamp(30px, 5.4vw, 46px);
          letter-spacing: -0.035em;
          line-height: 1.1;
          margin-bottom: 14px;
        }
        .lede {
          font-size: 15.5px;
          line-height: 1.7;
          color: var(--tx2);
          max-width: 64ch;
          margin-bottom: 22px;
        }

        /* ── Headline numbers ── */
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
          gap: 10px;
          margin-bottom: 34px;
        }
        .hero-stat {
          background: var(--bg1);
          border: 1px solid var(--br);
          border-radius: 12px;
          padding: 13px 15px;
        }
        .hero-stat b {
          display: block;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }
        .hero-stat span {
          display: block;
          font-size: 11.5px;
          color: var(--tx3);
          margin-top: 3px;
          line-height: 1.4;
        }

        /* ── Filters ── */
        .filters {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin-bottom: 34px;
        }
        .filter {
          padding: 6px 13px;
          border-radius: 999px;
          border: 1px solid var(--br);
          background: transparent;
          color: var(--tx2);
          font-size: 12.5px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .filter:hover:not(:disabled) {
          border-color: var(--brh);
          color: var(--tx);
        }
        .filter[aria-pressed='true'] {
          background: var(--tx);
          border-color: var(--tx);
          color: var(--inv2);
          font-weight: 600;
        }
        .filter:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .count {
          opacity: 0.65;
          font-variant-numeric: tabular-nums;
        }

        /* ── Charts ── */
        .charts {
          margin-bottom: 44px;
          padding: 24px;
          border: 1px solid var(--br);
          border-radius: 18px;
          background: var(--bg1);
        }
        .section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .section-head h2 {
          font-size: 19px;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .section-sub {
          font-size: 13px;
          line-height: 1.6;
          color: var(--tx2);
          max-width: 60ch;
        }
        .table-toggle {
          padding: 7px 13px;
          border-radius: 9px;
          border: 1px solid var(--br);
          background: transparent;
          color: var(--tx2);
          font-size: 12.5px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .table-toggle:hover {
          border-color: var(--brh);
          color: var(--tx);
        }
        .chart-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 14px;
        }
        .chart-card {
          background: var(--bg2);
          border: 1px solid var(--br);
          border-radius: 14px;
          padding: 16px;
          min-width: 0;
        }
        .chart-card figcaption h3 {
          font-size: 14px;
          letter-spacing: -0.01em;
          margin-bottom: 5px;
        }
        .chart-card figcaption p {
          font-size: 11.5px;
          line-height: 1.6;
          color: var(--tx3);
          margin-bottom: 12px;
        }
        .chart-holder { min-width: 0; }
        .chart {
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }
        .chart .grid {
          stroke: var(--brh);
          stroke-width: 1;
        }
        .chart .grid.faint { opacity: 0.45; }
        .chart .bar { fill: var(--ac); opacity: 0.55; transition: opacity 0.15s ease; }
        .chart .bar.active { opacity: 1; }
        .chart .bar-zero { fill: var(--tx3); opacity: 0.5; }
        .chart .dot.hollow { fill: var(--bg2); stroke-width: 2; }
        .chart .value {
          fill: var(--tx2);
          font-size: 9px;
          text-anchor: middle;
          font-family: var(--font-geist-mono), monospace;
        }
        .chart .tick {
          fill: var(--tx3);
          font-size: 8.5px;
          text-anchor: middle;
        }
        .chart .hit {
          cursor: pointer;
        }
        .chart .ring-bg { stroke: var(--bg3); }
        .chart .ring { transition: opacity 0.15s ease; }
        .chart .donut-num {
          fill: var(--tx);
          font-size: 30px;
          font-weight: 700;
          text-anchor: middle;
          letter-spacing: -0.03em;
        }
        .chart .donut-cap {
          fill: var(--tx3);
          font-size: 10px;
          text-anchor: middle;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .chart-tip {
          margin-top: 10px;
          font-size: 11.5px;
          line-height: 1.6;
          color: var(--tx2);
          min-height: 18px;
        }
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          margin-top: 12px;
          font-size: 11.5px;
          color: var(--tx2);
        }
        .legend li {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          list-style: none;
        }
        .legend.tall {
          flex-direction: column;
          gap: 8px;
          margin-top: 0;
          flex: 1;
        }
        .legend.tall li { min-width: 120px; }
        .swatch {
          width: 9px;
          height: 9px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .legend-num {
          margin-left: auto;
          font-family: var(--font-geist-mono), monospace;
          color: var(--tx3);
        }
        .donut-row {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .donut { width: 150px; flex-shrink: 0; }

        .stat-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 12px;
        }
        .stat dt {
          font-size: 11px;
          color: var(--tx3);
          margin-bottom: 3px;
          letter-spacing: 0.02em;
        }
        .stat dd { margin: 0; }
        .stat-value {
          display: block;
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .stat-sub {
          display: block;
          font-size: 10.5px;
          color: var(--tx3);
          margin-top: 2px;
        }

        .table-wrap {
          margin-top: 16px;
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .data-table caption {
          text-align: left;
          font-size: 11.5px;
          color: var(--tx3);
          padding-bottom: 10px;
        }
        .data-table th, .data-table td {
          padding: 7px 10px;
          text-align: right;
          border-bottom: 1px solid var(--br);
          white-space: nowrap;
        }
        .data-table thead th { color: var(--tx3); font-weight: 600; }
        .data-table tbody th {
          text-align: left;
          color: var(--tx2);
          font-weight: 500;
        }
        .data-table td {
          font-family: var(--font-geist-mono), monospace;
          color: var(--tx2);
        }

        /* ── Timeline ── */
        .release {
          position: relative;
          padding-left: 30px;
          padding-bottom: 44px;
          border-left: 1px solid var(--br);
        }
        .release:last-child {
          border-left-color: transparent;
          padding-bottom: 0;
        }
        .dot {
          position: absolute;
          left: -5px;
          top: 7px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--ac);
          border: 2px solid var(--bg);
        }
        .dot.latest {
          box-shadow: 0 0 0 4px var(--as);
        }
        .ver {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 7px;
        }
        .ver h2 {
          font-size: 20px;
          letter-spacing: -0.02em;
        }
        .date {
          font-size: 12.5px;
          color: var(--tx3);
          font-variant-numeric: tabular-nums;
        }
        .tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--brh);
          color: var(--ac-text);
        }
        .summary {
          font-size: 14px;
          line-height: 1.7;
          color: var(--tx2);
          max-width: 68ch;
          margin-bottom: 16px;
        }
        ul.changes {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        li.change {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--tx2);
        }
        .badge {
          flex-shrink: 0;
          margin-top: 1px;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 3px 7px;
          border-radius: 5px;
          min-width: 62px;
          text-align: center;
        }
        .empty {
          font-size: 13.5px;
          color: var(--tx3);
          padding: 20px 0;
        }

        /* ── Stack and footer ── */
        .stack {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 44px;
          padding-top: 26px;
          border-top: 1px solid var(--br);
        }
        .stack-label {
          font-size: 11.5px;
          color: var(--tx3);
          margin-right: 4px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid var(--br);
          background: var(--bg1);
          font-size: 11.5px;
          color: var(--tx2);
        }
        footer {
          margin-top: 30px;
          font-size: 12.5px;
          color: var(--tx3);
          line-height: 1.7;
        }
        footer a { color: var(--tx2); }
        footer p { margin-bottom: 7px; }
        footer code {
          font-family: var(--font-geist-mono), monospace;
          font-size: 11.5px;
          padding: 2px 5px;
          border-radius: 4px;
          background: var(--bg2);
          color: var(--tx2);
        }

        @media (max-width: 720px) {
          .wrap { padding: 22px 16px 64px; }
          .charts { padding: 16px; border-radius: 14px; }
          .chart-grid { grid-template-columns: 1fr; }
          .section-head { flex-direction: column; }
          .hero-stats { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
        }
        @media (max-width: 520px) {
          .wrap { padding: 18px 14px 56px; }
          h1 { margin-bottom: 11px; }
          .lede { font-size: 14.5px; margin-bottom: 18px; }
          .topbar { margin-bottom: 30px; }
          .release { padding-left: 22px; padding-bottom: 36px; }
          .badge { min-width: 54px; font-size: 9px; }
          li.change { font-size: 13px; }
          .hero-stat b { font-size: 19px; }
          .donut-row { gap: 14px; }
          .donut { width: 124px; }
        }
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <Link href="/" className="back">
            <ArrowLeft /> Back to home
          </Link>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>

        <h1>Changelog</h1>
        <p className="lede">
          Every user visible change to Kanbi, newest first. Each entry describes
          what is better now, not the internals of how it was fixed.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <b>{CHANGELOG.length}</b>
            <span>releases</span>
          </div>
          <div className="hero-stat">
            <b>{totalChanges}</b>
            <span>recorded changes</span>
          </div>
          <div className="hero-stat">
            <b>{counts.fixed ?? 0}</b>
            <span>fixes</span>
          </div>
          <div className="hero-stat">
            <b>{counts.added ?? 0}</b>
            <span>additions</span>
          </div>
          <div className="hero-stat">
            <b>{(counts.security ?? 0) + (counts.changed ?? 0)}</b>
            <span>improvements</span>
          </div>
        </div>

        <ReleaseCharts />

        <div className="filters" role="group" aria-label="Filter changes by type">
          {FILTERS.map((f) => {
            const n = counts[f.key] ?? 0
            // A filter with nothing behind it is disabled rather than hidden, so
            // the row does not reflow as the visitor clicks through.
            const disabled = n === 0
            return (
              <button
                key={f.key}
                type="button"
                className="filter"
                aria-pressed={filter === f.key}
                disabled={disabled}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span className="count">{n}</span>
              </button>
            )
          })}
        </div>

        {CHANGELOG.map((release, index) => {
          const matching = release.changes.filter(
            (c) => filter === 'all' || c.kind === filter
          )
          // Under a specific filter a release with no matching entry is skipped.
          // Under "Everything" every release shows even with no entries, because
          // a version quietly vanishing from the history would read as though it
          // never shipped.
          if (filter !== 'all' && matching.length === 0) return null

          return (
            <section key={release.version} className="release">
              <span
                className={`dot${index === 0 ? ' latest' : ''}`}
                aria-hidden="true"
              />
              <div className="ver">
                <h2>{release.version}</h2>
                <span className="date">{formatReleaseDate(release.date)}</span>
                {index === 0 && <span className="tag">Latest</span>}
              </div>
              <p className="summary">{release.summary}</p>

              {matching.length > 0 ? (
                <ul className="changes">
                  {matching.map((change, i) => {
                    const meta = KIND_META[change.kind]
                    return (
                      <li key={i} className="change">
                        <span
                          className="badge"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {meta.label}
                        </span>
                        <span>{change.text}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="empty">
                  No detailed notes were recorded for this version. The date
                  above is taken from the project manifest.
                </p>
              )}
            </section>
          )
        })}

        <div className="stack">
          <span className="stack-label">Built with</span>
          {TECH_STACK.map((item) => (
            <span key={item.name} className="chip">
              <item.Icon size={14} />
              {item.name}
            </span>
          ))}
        </div>

        <footer>
          <p>
            Current version: <strong>{latest?.version}</strong>, released{' '}
            {latest ? formatReleaseDate(latest.date) : 'not yet dated'}.
          </p>
          <p>
            Every figure on this page is measured from the repository. The full
            engineering record, including how each number was produced, is in{' '}
            <code>CHANGELOG.md</code>.
          </p>
        </footer>
      </div>
    </div>
  )
}

/* ── Icons, drawn locally so this page carries no icon dependency ── */

function ArrowLeft({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  )
}

function SunIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}