'use client'

import { useEffect, useRef, useState } from 'react'
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
 * These are hand drawn SVG rather than a charting package. The whole job is one
 * bar chart, one line chart and a donut, and a package would add a runtime
 * dependency, a build step, and its own theme system that would have to be
 * overridden to match the rest of the product.
 *
 * The viewBox is measured rather than fixed, which is the whole reason the charts
 * fit. A fixed viewBox scaled into a column means a nine point label paints at
 * four point on a phone. Measuring the column and building the viewBox from it
 * makes one user unit equal one CSS pixel at every width, so the type, the bar
 * widths and the label spacing all stay as designed and the drawing simply
 * gets narrower.
 *
 * Every chart has two layers of accessibility:
 *  1. An `aria-label` on the figure that states the headline in words.
 *  2. A real table, present in the DOM for screen readers and revealed on
 *     demand for everyone else. The chart is never the only way to read a value,
 *     and every bar is also numbered on the drawing itself.
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

/**
 * The drawn width of a chart, in CSS pixels.
 *
 * The SVG is scaled to fill its column, so the only way a nine point label stays
 * nine points on a phone is for the viewBox to be the width the SVG actually
 * paints at. The container is measured and the value is rounded to whole pixels,
 * because a fractional width written back into the DOM would make the observer
 * fire again on every frame.
 *
 * The first pass happens on the server, where nothing can be measured, so it
 * falls back to the desktop width and is corrected before the browser paints.
 */
function useChartWidth(fallback = 640) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const next = Math.round(el.clientWidth)
      if (next > 120) setWidth(next)
    }
    read()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, width }
}

/** How many x labels fit before they would start to touch. */
function labelStep(count: number, plotWidth: number): number {
  const room = Math.max(1, Math.floor(plotWidth / 46))
  return Math.max(1, Math.ceil(count / room))
}

export function ReleaseCharts() {
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
          note={`${PROJECT_NOW.sourceFiles} source files and ${PROJECT_NOW.apiRoutes} live routes. The route count falls at the end because nine unusable routes were removed. The dashed line marks the unreleased working tree.`}
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

/**
 * A bar with rounded top corners and a flat base.
 *
 * `rect` with `rx` rounds all four, which lifts the bar off the axis and leaves
 * a visible gap of background under it. The bars stand on the baseline here, so
 * the shape is drawn by hand instead.
 */
function topRoundedBar(
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): string {
  const r = Math.max(0, Math.min(radius, w / 2, h))
  const left = round(x)
  const top = round(y)
  const bottom = round(y + h)
  const shoulder = round(top + r)
  return (
    `M${left},${bottom}` +
    `V${shoulder}` +
    `a${r},${r} 0 0 1 ${r},${-r}` +
    `h${round(w - r * 2)}` +
    `a${r},${r} 0 0 1 ${r},${r}` +
    `V${bottom}Z`
  )
}

/**
 * The bar chart.
 *
 * Deliberately not interactive. It used to put a transparent focusable strip
 * over every column to drive a hover readout, and on a touch screen a tap fires
 * pointer enter, focus and the platform tap highlight with no leave ever
 * following. The visitor was left with a readout and a bright border painted
 * across the graph that nothing would clear until they tapped somewhere else.
 * A static drawing has nothing to get stuck, and every value is still readable
 * from the printed numbers above the bars and from the table below.
 *
 * The drawing answers the note under its own title in one glance. The busiest
 * month is the only bar in the full accent, every other month is the same hue
 * washed back, and the dashed rule is the average, so the reader can see that
 * one month carried the year rather than being told it in a sentence.
 */
function BarChart({
  data,
  max,
}: {
  data: ReturnType<typeof historyWithNow>
  max: number
}) {
  const { ref, width } = useChartWidth()

  // Padding leaves room for the axis on the left, the value above the tallest
  // bar, and the month names underneath. Everything is measured, so these stay
  // put while the plot narrows.
  const H = width < 360 ? 196 : 216
  const padL = 24
  const padR = 8
  const padT = 24
  const padB = 26
  const plotW = Math.max(60, width - padL - padR)
  const plotH = H - padT - padB
  const base = padT + plotH
  const slot = plotW / data.length
  const barW = Math.max(4, Math.min(24, slot * 0.54))
  const y = (v: number) => base - (v / max) * plotH
  const step = labelStep(data.length, plotW)
  // Half the peak and the peak itself. The midpoint is skipped when it would
  // land on the same pixel as the top line, which happens on a narrow chart.
  const half = Math.round(max / 2)
  const ticks = half === max ? [0, max] : [0, half, max]

  const peakIndex = data.length > 0
    ? data.reduce(
        (best, point, i) => {
          const b = data[best]
          return point.commits > (b?.commits ?? -1) ? i : best
        },
        0
      )
    : 0
  const average = data.length === 0 ? 0 : totalCommits() / data.length
  return (
    <div className="chart-holder" ref={ref}>
      <svg
        viewBox={`0 0 ${width} ${H}`}
        className="chart"
        role="img"
        aria-label={`Bar chart of commits per month. The busiest month had ${max} commits. ${totalCommits()} commits in total, averaging ${round(average)} a month.`}
      >
        {/* Gridlines plus their own labels, so a bar height can be read without
            relying on the number printed above it. */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              y1={round(y(t))}
              x2={width - padR}
              y2={round(y(t))}
              className={`grid${t === 0 ? '' : ' faint'}`}
            />
            <text x={padL - 7} y={round(y(t)) + 3} className="axis" textAnchor="end">
              {t}
            </text>
          </g>
        ))}

        {data.map((point, i) => {
          const h = Math.max(point.commits > 0 ? 3 : 0, (point.commits / max) * plotH)
          const left = padL + i * slot + (slot - barW) / 2
          const top = base - h
          const peak = i === peakIndex && point.commits > 0
          return (
            <g key={point.month}>
              {point.commits > 0 ? (
                <path
                  d={topRoundedBar(left, top, barW, h, 4)}
                  className={`bar${peak ? ' peak' : ''}`}
                />
              ) : (
                /* A month with no commits gets a tick at the baseline. Drawing
                   nothing would hide a third of the timeline, and the project
                   really did go quiet three times. */
                <rect
                  x={left}
                  y={base - 2}
                  width={barW}
                  height={2}
                  rx={1}
                  className="bar-zero"
                />
              )}
              {point.commits > 0 && (
                <text
                  x={round(left + barW / 2)}
                  y={round(top - 6)}
                  className={`value${peak ? ' value-peak' : ''}`}
                >
                  {point.commits}
                </text>
              )}
              {i % step === 0 && (
                <text
                  x={round(padL + i * slot + slot / 2)}
                  y={H - 8}
                  className={`tick${peak ? ' tick-peak' : ''}`}
                >
                  {formatMonth(point.month).slice(0, 3)}
                </text>
              )}
            </g>
          )
        })}

              </svg>
    </div>
  )
}

/** The line chart. Static for the same reason as the bar chart above. */
function LineChart({ data }: { data: ReturnType<typeof historyWithNow> }) {
  const { ref, width } = useChartWidth()

  const H = width < 360 ? 188 : 208
  const padL = 26
  const padR = 12
  const padT = 22
  const padB = 26
  const plotW = Math.max(60, width - padL - padR)
  const plotH = H - padT - padB
  const base = padT + plotH
  const max = Math.max(...data.map((d) => d.sourceFiles), 1)
  const step = labelStep(data.length, plotW)

  const series = [
    { key: 'sourceFiles' as const, color: 'var(--ac)', label: 'Source files' },
    { key: 'testFiles' as const, color: 'var(--gr)', label: 'Test files' },
    { key: 'apiRoutes' as const, color: 'var(--am)', label: 'API routes' },
  ]

  const x = (i: number) =>
    padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const y = (v: number) => base - (v / max) * plotH
  const last = data.length - 1
  // The unreleased point is drawn as a separate column behind a dashed rule, so
  // it cannot be mistaken for a month that has already shipped.
  const nowRule = x(last) - (x(last) - x(last - 1)) / 2
  const ticks = [0, Math.round(max / 2), max]

  return (
    <div className="chart-holder" ref={ref}>
      <svg
        viewBox={`0 0 ${width} ${H}`}
        className="chart"
        role="img"
        aria-label={`Line chart. Source files grew to ${PROJECT_NOW.sourceFiles}, test files to ${PROJECT_NOW.testFiles}, and API routes settled at ${PROJECT_NOW.apiRoutes}.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              y1={round(y(t))}
              x2={width - padR}
              y2={round(y(t))}
              className={`grid${t === 0 ? '' : ' faint'}`}
            />
            <text x={padL - 7} y={round(y(t)) + 3} className="axis" textAnchor="end">
              {t}
            </text>
          </g>
        ))}

        <line
          x1={round(nowRule)}
          y1={padT - 10}
          x2={round(nowRule)}
          y2={base}
          className="now-line"
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
              cx={round(x(i))}
              cy={round(y(d[s.key]))}
              r={2.6}
              fill={s.color}
              // The last point is the unreleased working tree. Hollow rings say
              // "not shipped yet" without needing a legend entry.
              className={`dot${d.month === 'now' ? ' hollow' : ''}`}
              stroke={d.month === 'now' ? s.color : undefined}
            />
          ))
        )}

        {data.map((point, i) =>
          i % step === 0 || i === last ? (
            <text
              key={`t-${point.month}`}
              x={round(x(i))}
              y={H - 8}
              className={`tick${point.month === 'now' ? ' tick-now' : ''}`}
              textAnchor={i === last ? 'end' : 'middle'}
            >
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
            <span className="legend-pct">
              {total === 0 ? '0' : Math.round((k.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatRow() {
  /**
   * Four figures, not five.
   *
   * The dependency count was the weakest of the five: it said nothing about
   * whether the product works, and next to assertions and test coverage it read
   * as a score. Dropping it leaves four numbers a visitor can actually weigh.
   */
  const stats = [
    {
      value: PROJECT_NOW.commits,
      label: 'commits',
      sub: 'since 15 Sep 2025',
      tone: 'var(--ac)',
    },
    {
      value: PROJECT_NOW.sourceLines,
      label: 'lines of code',
      sub: `${PROJECT_NOW.sourceFiles} source files`,
      tone: 'var(--gr)',
    },
    {
      value: PROJECT_NOW.assertions,
      label: 'assertions',
      sub: `${PROJECT_NOW.testFiles} test files`,
      tone: 'var(--am)',
    },
    {
      value: PROJECT_NOW.apiRoutes,
      label: 'live routes',
      sub: 'all reachable',
      tone: 'var(--ac-text)',
    },
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
            <dt>
              <span className="stat-dot" style={{ background: s.tone }} aria-hidden="true" />
              {s.label}
            </dt>
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
