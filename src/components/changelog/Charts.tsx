'use client'

import { useState } from 'react'
import {
  PROJECT_NOW,
  historyWithNow,
  monthlyCommits,
  quietMonths,
  totalCommits,
  busiestMonth,
} from '@/lib/changelog-stats'
import { CHANGELOG, KIND_META, type ChangeKind } from '@/lib/changelog-data'

/**
 * Charts for the changelog page.
 *
 * These are hand drawn SVG rather than a charting package. The whole job is six
 * bars and two lines, and a package would add a runtime dependency, a build
 * step, and its own theme system that would have to be overridden to match the
 * rest of the product.
 *
 * Every chart has three layers of accessibility:
 *  1. An `aria-label` on the figure that states the headline in words.
 *  2. A tooltip on hover and on keyboard focus, which is the same text.
 *  3. A real table, present in the DOM for screen readers and revealed on
 *     demand for everyone else. The chart is never the only way to read a value.
 *
 * Colours come from CSS variables so the charts follow the page theme. Nothing
 * here reads the theme itself, which is why a single render serves both.
 */

interface KindCount {
  kind: ChangeKind
  label: string
  color: string
  count: number
}

function kindCounts(): KindCount[] {
  const counts = new Map<ChangeKind, number>()
  for (const release of CHANGELOG) {
    for (const change of release.changes) {
      counts.set(change.kind, (counts.get(change.kind) ?? 0) + 1)
    }
  }
  return (Object.keys(KIND_META) as ChangeKind[])
    .map((kind) => ({
      kind,
      label: KIND_META[kind].label,
      color: KIND_META[kind].color,
      count: counts.get(kind) ?? 0,
    }))
    .filter((entry) => entry.count > 0)
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Turns `2026-03` into `Mar 26`, and the unreleased marker into `Now`. */
function formatMonth(month: string): string {
  if (month === 'now') return 'Now'
  const parts = month.split('-')
  const name = MONTH_NAMES[Number(parts[1]) - 1]
  const year = parts[0]
  // A malformed key falls back to the raw string rather than printing
  // "undefined", which is what a plain index would have produced.
  if (!name || !year) return month
  return `${name} ${year.slice(2)}`
}

/** Rounds to one decimal place without floating point drift. */
function round(value: number): number {
  return Math.round(value * 10) / 10
}

export function ReleaseCharts() {
  const [showTable, setShowTable] = useState(false)
  // Two series, because they are not comparable. Commits are counted per month
  // and must not carry a running total. Everything else is a snapshot at a
  // point in time and can.
  const months = monthlyCommits()
  const snapshots = historyWithNow()
  const maxCommits = Math.max(...months.map((d) => d.commits), 1)
  const busiest = busiestMonth()
  const quiet = quietMonths()
  const kinds = kindCounts()
  const totalKinds = kinds.reduce((sum, k) => sum + k.count, 0)

  return (
    <section className="charts" aria-labelledby="charts-heading">
      <div className="section-head">
        <div>
          <h2 id="charts-heading">Project shape over time</h2>
          <p className="section-sub">
            Measured from the repository, oldest at the left.{' '}
            {quiet.length > 0 && (
              <>
                {quiet.length} of the {months.length} months had no commits at
                all and are drawn at zero rather than skipped.
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          className="table-toggle"
          aria-expanded={showTable}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? 'Hide the numbers' : 'Show the numbers'}
        </button>
      </div>

      <div className="chart-grid">
        <ChartCard
          title="Commits per month"
          note={`${totalCommits()} commits over ${months.length} months. Busiest was ${formatMonth(busiest.month)} with ${busiest.commits}.`}
        >
          <BarChart data={months} max={maxCommits} />
        </ChartCard>

        <ChartCard
          title="What the codebase is made of"
          note={`${PROJECT_NOW.sourceFiles} source files and ${PROJECT_NOW.apiRoutes} live routes. The route count falls at the end because nine unusable routes were removed. The last point is the unreleased working tree.`}
        >
          <LineChart data={snapshots} />
        </ChartCard>
      </div>

      <div className="chart-grid">
        <ChartCard
          title="Change mix"
          note={`${totalKinds} recorded changes across every release, grouped by what kind of work they were.`}
        >
          <DonutChart kinds={kinds} total={totalKinds} />
        </ChartCard>

        <StatRow />
      </div>

      {showTable && (
        <div className="table-wrap">
          <table className="data-table">
            <caption>
              Every number in the charts above, one row per month. The final row
              is the unreleased working tree, so its commit count is not a month
              and is shown as a dash.
            </caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Commits</th>
                <th scope="col">Source files</th>
                <th scope="col">API routes</th>
                <th scope="col">Test files</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((point) => (
                <tr key={point.month}>
                  <th scope="row">
                    {point.month === 'now'
                      ? 'Unreleased'
                      : formatMonth(point.month)}
                  </th>
                  <td>{point.month === 'now' ? 'n/a' : point.commits}</td>
                  <td>{point.sourceFiles}</td>
                  <td>{point.apiRoutes}</td>
                  <td>{point.testFiles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ChartCard({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <figure className="chart-card">
      <figcaption>
        <h3>{title}</h3>
        <p>{note}</p>
      </figcaption>
      {children}
    </figure>
  )
}

function BarChart({
  data,
  max,
}: {
  data: ReturnType<typeof historyWithNow>
  max: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 520
  const H = 168
  const padBottom = 22
  const padTop = 8
  const plotH = H - padBottom - padTop
  const slot = W / data.length
  const barW = Math.max(4, slot * 0.56)
  // Indexed access is checked in this project, so the hovered row is resolved
  // once and narrowed, rather than reaching into the array three times.
  const focused = hover === null ? undefined : data[hover]

  return (
    <div className="chart-holder">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label={`Bar chart of commits per month. The busiest month had ${max} commits. ${totalCommits()} commits in total.`}
      >
        {/* Baseline and mid gridline give the bars something to be read against. */}
        <line x1="0" y1={padTop + plotH} x2={W} y2={padTop + plotH} className="grid" />
        <line
          x1="0"
          y1={padTop + plotH / 2}
          x2={W}
          y2={padTop + plotH / 2}
          className="grid faint"
        />

        {data.map((point, i) => {
          const h = Math.max(point.commits > 0 ? 3 : 0, (point.commits / max) * plotH)
          const x = i * slot + (slot - barW) / 2
          const y = padTop + plotH - h
          const active = hover === i
          return (
            <g key={point.month}>
              <rect
                x={i * slot}
                y={padTop}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${formatMonth(point.month)}: ${point.commits} commits`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="hit"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={Math.min(3, barW / 2)}
                className={`bar${active ? ' active' : ''}`}
              />
              {/* A month with no commits gets a tick at the baseline. Drawing
                  nothing would hide a third of the timeline, and the project
                  really did go quiet three times. */}
              {point.commits === 0 && (
                <rect
                  x={x}
                  y={padTop + plotH - 2}
                  width={barW}
                  height={2}
                  rx={1}
                  className="bar-zero"
                />
              )}
              {point.commits > 0 && (
                <text x={x + barW / 2} y={y - 5} className="value">
                  {point.commits}
                </text>
              )}
              {/* Thirteen month names will not fit across the chart without
                  touching, so only every third is labelled. The rest stay
                  reachable through the tooltip and the table. */}
              {i % 3 === 0 && (
                <text x={i * slot + slot / 2} y={H - 7} className="tick">
                  {formatMonth(point.month).slice(0, 3)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {focused && (
        <p className="chart-tip" role="status">
          <strong>{formatMonth(focused.month)}</strong>
          {' · '}
          {focused.commits} commits, {focused.sourceFiles} source files,{' '}
          {focused.apiRoutes} routes, {focused.testFiles} test files
        </p>
      )}
    </div>
  )
}

function LineChart({ data }: { data: ReturnType<typeof historyWithNow> }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 520
  const H = 168
  const padBottom = 22
  const padTop = 10
  const plotH = H - padBottom - padTop
  const max = Math.max(...data.map((d) => d.sourceFiles), 1)

  const series = [
    { key: 'sourceFiles' as const, color: 'var(--ac)', label: 'Source files' },
    { key: 'testFiles' as const, color: 'var(--gr)', label: 'Test files' },
    { key: 'apiRoutes' as const, color: 'var(--am)', label: 'API routes' },
  ]

  const x = (i: number) => (i / (data.length - 1)) * (W - 8) + 4
  const y = (v: number) => padTop + plotH - (v / max) * plotH
  const focused = hover === null ? undefined : data[hover]

  return (
    <div className="chart-holder">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label={`Line chart. Source files grew to ${PROJECT_NOW.sourceFiles}, test files to ${PROJECT_NOW.testFiles}, and API routes settled at ${PROJECT_NOW.apiRoutes}.`}
      >
        <line x1="0" y1={padTop + plotH} x2={W} y2={padTop + plotH} className="grid" />
        <line
          x1="0"
          y1={padTop + plotH / 2}
          x2={W}
          y2={padTop + plotH / 2}
          className="grid faint"
        />

        {series.map((s) => {
          const points = data.map((d, i) => `${round(x(i))},${round(y(d[s.key]))}`).join(' ')
          return (
            <polyline
              key={s.key}
              points={points}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )
        })}

        {series.map((s) =>
          data.map((d, i) => (
            <circle
              key={`${s.key}-${i}`}
              cx={x(i)}
              cy={y(d[s.key])}
              r={hover === i ? 3.6 : 2.4}
              fill={s.color}
              // The last point is the unreleased working tree. Hollow rings say
              // "not shipped yet" without needing a legend entry.
              className={`dot${d.month === 'now' ? ' hollow' : ''}`}
              stroke={d.month === 'now' ? s.color : undefined}
            />
          ))
        )}

        {data.map((point, i) => (
          <rect
            key={point.month}
            x={x(i) - (W / data.length) / 2}
            y={padTop}
            width={W / data.length}
            height={plotH}
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={`${formatMonth(point.month)}: ${point.sourceFiles} source files, ${point.testFiles} test files, ${point.apiRoutes} API routes`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="hit"
          />
        ))}

        {data.map((point, i) =>
          i % 3 === 0 || point.month === 'now' ? (
            <text key={`t-${point.month}`} x={x(i)} y={H - 7} className="tick">
              {point.month === 'now' ? 'Now' : formatMonth(point.month).slice(0, 3)}
            </text>
          ) : null
        )}
      </svg>

      <ul className="legend">
        {series.map((s) => (
          <li key={s.key}>
            <span className="swatch" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>

      {focused && (
        <p className="chart-tip" role="status">
          <strong>{formatMonth(focused.month)}</strong>
          {' · '}
          {focused.sourceFiles} source files, {focused.testFiles} test files,{' '}
          {focused.apiRoutes} API routes
        </p>
      )}
    </div>
  )
}

function DonutChart({ kinds, total }: { kinds: KindCount[]; total: number }) {
  const size = 168
  const r = 66
  const stroke = 22
  const c = 2 * Math.PI * r

  /**
   * Each arc needs to know how far around the circle it starts.
   *
   * The offsets are worked out in one pass into a frozen list before any JSX
   * exists. Advancing a counter while rendering looks fine once and breaks the
   * day React renders the list twice or reorders it.
   */
  const arcs: Array<{ kind: KindCount; dash: string; offset: number }> = []
  let travelled = 0
  for (const kind of kinds) {
    const fraction = total === 0 ? 0 : kind.count / total
    arcs.push({
      kind,
      dash: `${round(fraction * c)} ${round(c - fraction * c)}`,
      offset: travelled,
    })
    travelled += fraction * c
  }

  return (
    <div className="chart-holder donut-row">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="chart donut"
        role="img"
        aria-label={`Donut chart of ${kinds
          .map((k) => `${k.count} ${k.label.toLowerCase()}`)
          .join(', ')}.`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="ring-bg"
        />
        {arcs.map((arc) => (
          <circle
            key={arc.kind.kind}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={arc.kind.color}
            strokeWidth={stroke}
            strokeDasharray={arc.dash}
            strokeDashoffset={round(-arc.offset)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="ring"
          />
        ))}
        <text x={size / 2} y={size / 2 - 2} className="donut-num">
          {total}
        </text>
        <text x={size / 2} y={size / 2 + 16} className="donut-cap">
          changes
        </text>
      </svg>

      <ul className="legend tall">
        {kinds.map((k) => (
          <li key={k.kind}>
            <span className="swatch" style={{ background: k.color }} aria-hidden="true" />
            {k.label}
            <span className="legend-num">{k.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatRow() {
  const stats = [
    { value: PROJECT_NOW.commits, label: 'commits', sub: 'since 15 Sep 2025' },
    { value: PROJECT_NOW.sourceLines, label: 'lines of code', sub: `${PROJECT_NOW.sourceFiles} files` },
    { value: PROJECT_NOW.assertions, label: 'assertions', sub: `${PROJECT_NOW.testFiles} test files` },
    { value: PROJECT_NOW.apiRoutes, label: 'live routes', sub: 'all reachable' },
    { value: PROJECT_NOW.dependencies, label: 'dependencies', sub: `plus ${PROJECT_NOW.devDependencies} build tools` },
  ]

  return (
    <figure className="chart-card stat-card">
      <figcaption>
        <h3>Right now</h3>
        <p>
          Counted against the working tree. Every figure is reproducible with a
          single command, listed in the project changelog.
        </p>
      </figcaption>
      <dl className="stat-row">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <dt>{s.label}</dt>
            <dd>
              <span className="stat-value">{s.value.toLocaleString('en-US')}</span>
              <span className="stat-sub">{s.sub}</span>
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}

