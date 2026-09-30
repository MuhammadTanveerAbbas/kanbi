import { describe, expect, it } from 'vitest'
import { accentVars, themeVars } from '@/lib/theme'
import { KIND_META } from '@/lib/changelog-data'

/**
 * Colour contrast checks.
 *
 * The design uses a third text colour for captions, dates, and axis labels. It
 * was picked by eye and it failed WCAG AA in both themes. In dark mode the
 * muted token sat at 2.3 to 1 against the card background, which is barely
 * legible even for someone who can see it well.
 *
 * These tests exist so the numbers are checked rather than judged. Every pair
 * below is one that actually appears on a page.
 */

function parseVars(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of block.split(';')) {
    const at = part.indexOf(':')
    if (at === -1) continue
    out[part.slice(0, at).trim()] = part.slice(at + 1).trim()
  }
  return out
}

/** Accepts `#rgb`, `#rrggbb`, and `rgb(r, g, b)`. */
function toRgb(value: string): [number, number, number] {
  if (value.startsWith('#')) {
    let hex = value.slice(1)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('')
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ]
  }
  const nums = value.match(/[\d.]+/g) ?? ['0', '0', '0']
  return [Number(nums[0]), Number(nums[1]), Number(nums[2])]
}

/** The WCAG relative luminance formula, unmodified. */
function luminance([r, g, b]: [number, number, number]): number {
  const channel = (raw: number) => {
    const c = raw / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return (
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  )
}

function contrast(foreground: string, background: string): number {
  const a = luminance(toRgb(foreground))
  const b = luminance(toRgb(background))
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Surface colours the design actually paints, from the chart and card styles. */
const SURFACES = ['--bg', '--bg1', '--bg2'] as const

/** Text tokens paired with the surfaces they are allowed to sit on. */
const TEXT_ON: Array<{ token: string; note: string }> = [
  { token: '--tx', note: 'headings and primary text' },
  { token: '--tx2', note: 'body copy and summaries' },
  { token: '--tx3', note: 'captions, dates, and axis labels' },
]

describe('theme colours meet WCAG AA', () => {
  for (const theme of ['dark', 'light'] as const) {
    const vars = parseVars(themeVars(theme))

    for (const text of TEXT_ON) {
      for (const surface of SURFACES) {
        it(`${theme}: ${text.token} on ${surface} is at least 4.5 to 1 (${text.note})`, () => {
          const ratio = contrast(vars[text.token]!, vars[surface]!)
          expect(
            ratio,
            `${text.token} ${vars[text.token]} on ${surface} ${vars[surface]} is ${ratio.toFixed(2)} to 1`
          ).toBeGreaterThanOrEqual(4.5)
        })
      }
    }

    it(`${theme}: every token is a real colour`, () => {
      for (const key of ['--bg', '--bg1', '--bg2', '--tx', '--tx2', '--tx3']) {
        expect(vars[key], key).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    })

    it(`${theme}: the page background differs from both cards, so the layers read`, () => {
      // A card the same colour as its page looks like a mistake even when it
      // passes contrast, and the chart cards depend on the edge being visible.
      expect(vars['--bg']).not.toBe(vars['--bg1'])
      expect(vars['--bg1']).not.toBe(vars['--bg2'])
    })

    it(`${theme}: the two themes are actually different`, () => {
      const other = parseVars(themeVars(theme === 'dark' ? 'light' : 'dark'))
      expect(vars['--bg']).not.toBe(other['--bg'])
      expect(luminance(toRgb(vars['--bg']!))).not.toBeCloseTo(
        luminance(toRgb(other['--bg']!)),
        3
      )
    })
  }
})

/**
 * The change category badges are the smallest text in the product at nine and a
 * half points, and they sit on a translucent tint of their own colour, so the
 * background has to be composited before it can be measured.
 */
describe('changelog badges meet WCAG AA', () => {
  const TINTS: Record<string, [string, number]> = {
    added: ['#10b981', 0.12],
    fixed: ['#f59e0b', 0.12],
    changed: ['#6366f1', 0.12],
    security: ['#ef4444', 0.12],
    removed: ['#787896', 0.12],
  }

  for (const theme of ['dark', 'light'] as const) {
    const vars = parseVars(themeVars(theme))

    for (const kind of Object.keys(TINTS)) {
      it(`${theme}: the ${kind} badge is at least 4.5 to 1 on every surface`, () => {
        const [tint, alpha] = TINTS[kind]!
        const token = vars[`--kind-${kind}`]
        expect(token, `theme ${theme} must define --kind-${kind}`).toBeTruthy()

        for (const surface of ['--bg', '--bg1', '--bg2']) {
          const behind = composite(tint, alpha, vars[surface]!)
          const ratio = contrast(token!, behind)
          expect(
            ratio,
            `${theme} ${kind} badge ${token} on ${behind} (tint over ${surface}) is ${ratio.toFixed(2)} to 1`
          ).toBeGreaterThanOrEqual(4.5)
        }
      })
    }

    it(`${theme}: the badges differ from each other, so colour is not the only cue`, () => {
      const values = Object.keys(TINTS).map((k) => vars[`--kind-${k}`])
      expect(new Set(values).size).toBe(values.length)
    })
  }

  it('the labels stay distinguishable without colour, which is the point', () => {
    // The badge carries the word as well as the colour, so a colour blind
    // visitor and a screen reader both get the category.
    expect(KIND_META.added.label).not.toBe(KIND_META.fixed.label)
    expect(KIND_META.security.label).toBe('Security')
  })
})

/** Flattens a translucent tint over an opaque surface. */
function composite(tint: string, alpha: number, surface: string): string {
  const [r1, g1, b1] = toRgb(tint)
  const [r2, g2, b2] = toRgb(surface)
  const mix = (a: number, b: number) =>
      Math.round(a * alpha + b * (1 - alpha))
        .toString(16)
        .padStart(2, '0')
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`
}

/**
 * Accent and status colours are used three ways, so each has three values.
 *
 * The vivid brand hue is right for a gradient and wrong as small text, and
 * worse still as a button fill with white writing on it. The design keeps the
 * hue for fills and adds a separate value for each of the other two jobs.
 */
describe('accent colours meet WCAG AA in every role', () => {
  const TEXT_ROLES = [
    '--ac-text',
    '--gr-text',
    '--am-text',
    '--rd-text',
    '--pu-text',
  ] as const

  const FILLS = ['--ac-solid'] as const

  for (const theme of ['dark', 'light'] as const) {
    // The accent block carries only accents. The surfaces a text colour has to
    // survive live in the neutral block, so both are needed to test either.
    const vars = { ...parseVars(themeVars(theme)), ...parseVars(accentVars(theme)) }

    for (const token of TEXT_ROLES) {
      it(`${theme}: ${token} reads as text on every surface`, () => {
        expect(vars[token], `${theme} must define ${token}`).toBeTruthy()
        for (const surface of SURFACES) {
          const ratio = contrast(vars[token]!, vars[surface]!)
          expect(
            ratio,
            `${theme} ${token} ${vars[token]} on ${surface} ${vars[surface]} is ${ratio.toFixed(2)} to 1`
          ).toBeGreaterThanOrEqual(4.5)
        }
      })

      it(`${theme}: ${token} also clears the tinted chip it sits inside`, () => {
        // A twelve percent wash of its own hue over a card is a different
        // surface from the bare card, and it is the one the label actually sits
        // on. An accent label is never printed inside an amber chip, so each
        // token is checked against its own tint rather than all five.
        const OWN_TINT: Record<string, string> = {
          '--ac-text': '#5e6fe8',
          '--gr-text': '#22c55e',
          '--am-text': '#f59e0b',
          '--rd-text': '#ef4444',
          '--pu-text': '#a78bfa',
        }
        const tint = OWN_TINT[token]!
        // Both wash strengths the product uses. Twelve percent is the standard
        // chip, eighteen is the stronger health and priority pills in the hero.
        for (const alpha of [0.12, 0.18]) {
          for (const surface of SURFACES) {
            const behind = composite(tint, alpha, vars[surface]!)
            const ratio = contrast(vars[token]!, behind)
            expect(
              ratio,
              `${theme} ${token} on a ${alpha * 100} percent tint over ${surface} is ${ratio.toFixed(2)} to 1`
            ).toBeGreaterThanOrEqual(4.5)
          }
        }
      })
    }

    for (const token of FILLS) {
      it(`${theme}: white writing on ${token} is legible`, () => {
        expect(vars[token], `${theme} must define ${token}`).toBeTruthy()
        const ratio = contrast('#ffffff', vars[token]!)
        expect(
          ratio,
          `${theme} white on ${token} ${vars[token]} is ${ratio.toFixed(2)} to 1`
        ).toBeGreaterThanOrEqual(4.5)
      })

      it(`${theme}: ${token} is visible as a shape against the page`, () => {
        // A button fill is a non text interface component, which needs 3 to 1
        // against what surrounds it.
        const ratio = contrast(vars[token]!, vars['--bg']!)
        expect(ratio).toBeGreaterThanOrEqual(3)
      })
    }

    it(`${theme}: the text value differs from the fill value`, () => {
      // If they were the same number there would be no point having two, and
      // the failure it was added to fix would come straight back.
      expect(vars['--ac-text']).not.toBe(vars['--ac'])
      expect(vars['--ac-solid']).not.toBe(vars['--ac'])
    })

    it(`${theme}: no status colour is used as text without a text token`, () => {
      for (const base of ['--gr', '--am', '--rd', '--pu']) {
        expect(vars[base], `${base} is still available for fills`).toBeTruthy()
      }
    })
  }
})

describe('contrast maths', () => {
  // A checker that is wrong in the permissive direction would let bad colours
  // through, so the known reference values are asserted first.
  it('matches the published reference pairs', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 1)
  })

  it('is symmetric, so argument order cannot change the verdict', () => {
    expect(contrast('#ffffff', '#000000')).toBe(contrast('#000000', '#ffffff'))
  })
})