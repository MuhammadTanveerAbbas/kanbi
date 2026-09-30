import { test, expect } from '@playwright/test'

/**
 * Every public page must actually paint itself.
 *
 * This exists because `/terms` shipped with no stylesheet applied at all. The
 * server sent the right markup and the right class names, the browser built the
 * element and attached the scope hash, and there was no error anywhere. The
 * page rendered as unstyled black text on a transparent background and nothing
 * said so. The only way to notice was to measure the computed style instead of
 * reading the source.
 *
 * A green status code and a present heading are not evidence that a page is
 * styled. The background colour is.
 */

const PUBLIC_PAGES = [
  '/',
  '/pricing',
  '/privacy',
  '/terms',
  '/changelog',
  '/sign-in',
  '/sign-up',
]

for (const path of PUBLIC_PAGES) {
  test(`${path} applies its stylesheet`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(200)

    const result = await page.evaluate(() => {
      // The element that owns the page palette. Most pages put it on a wrapper,
      // and the pricing page puts it on the document root instead.
      const shell =
        document.querySelector('.lp') ??
        document.querySelector('.cl-page') ??
        document.querySelector('.legal-page') ??
        document.querySelector('.auth-shell') ??
        document.body

      const hasTokens = getComputedStyle(shell).getPropertyValue('--bg').trim() !== ''
      const style = getComputedStyle(hasTokens ? shell : document.documentElement)
      const painted = style.backgroundColor

      return {
        painted,
        transparent: painted === 'rgba(0, 0, 0, 0)' || painted === 'transparent',
        text: getComputedStyle(shell).color,
        // At least one scoped stylesheet must have been injected, not just the
        // global one.
        styleTags: document.querySelectorAll('style').length,
        headingFont: (() => {
          const h1 = document.querySelector('h1')
          return h1
            ? (getComputedStyle(h1).fontFamily.split(',')[0] ?? '').replace(/"/g, '')
            : null
        })(),
      }
    })

    expect(result.transparent, `${path} has no painted background`).toBe(false)
    expect(result.styleTags, `${path} injected no component stylesheet`).toBeGreaterThan(1)
    // Every page loads the same two families, so every heading must resolve to
    // the display face rather than the system fallback.
    expect(result.headingFont, `${path} heading font`).toBe('Sora')
  })
}

test.describe('the page palette is the shared one', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} reads the shared tokens`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' })
      const tokens = await page.evaluate(() => {
        const shell =
          document.querySelector('.lp') ??
          document.querySelector('.cl-page') ??
          document.querySelector('.legal-page') ??
          document.querySelector('.auth-shell') ??
          document.body
        const style = getComputedStyle(shell)
        const read = (name: string) => style.getPropertyValue(name).trim()
        return {
          bg: read('--bg'),
          tx: read('--tx'),
          tx2: read('--tx2'),
          tx3: read('--tx3'),
          acText: read('--ac-text'),
          acSolid: read('--ac-solid'),
        }
      })

      expect(tokens.tx, `${path} --tx`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(tokens.tx2, `${path} --tx2`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(tokens.tx3, `${path} --tx3`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(tokens.bg, `${path} --bg`).toMatch(/^#[0-9a-f]{6}$/i)
      // The accent needs a separate value for text and for button fills, so a
      // page missing either one is not using the shared palette.
      expect(tokens.acText, `${path} --ac-text`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(tokens.acSolid, `${path} --ac-solid`).toMatch(/^#[0-9a-f]{6}$/i)
    })
  }
})

test.describe('muted text is legible everywhere', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} has no small text below 4.5 to 1`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' })

      const failures = await page.evaluate(() => {
      type Rgb = [number, number, number]

      /** Reads a computed colour into channels plus its alpha. */
      function readColour(value: string): { rgb: Rgb; alpha: number } {
        const parts = (value.match(/[\d.]+/g) ?? ['0', '0', '0', '0']).map(Number)
        return {
          rgb: [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0],
          alpha: value.startsWith('rgba') || parts.length > 3 ? (parts[3] ?? 1) : 1,
        }
      }

      /** Paints a translucent colour over an opaque one. */
      function over(top: { rgb: Rgb; alpha: number }, bottom: Rgb): Rgb {
        const a = top.alpha
        return [
          top.rgb[0] * a + bottom[0] * (1 - a),
          top.rgb[1] * a + bottom[1] * (1 - a),
          top.rgb[2] * a + bottom[2] * (1 - a),
        ]
      }

      function luminance(rgb: Rgb): number {
        const channel = (n: number) => {
          const c = n / 255
          return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        }
        const r = rgb[0] ?? 0
        const g = rgb[1] ?? 0
        const b = rgb[2] ?? 0
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      }

      function ratio(fg: Rgb, bg: Rgb): number {
        const a = luminance(fg)
        const b = luminance(bg)
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      }

      /**
       * Resolves the colour actually behind a node.
       *
       * Walking up and stopping at the first non transparent background is not
       * enough, because most of the tinted chips in this product are
       * deliberately translucent. Treating `rgba(239, 68, 68, 0.12)` as if it
       * were solid red reports every one of them as 1 to 1, which reads as a
       * catastrophe that does not exist. So every layer is composited down to
       * opaque before it is measured.
       */
      function resolvedBackground(node: Element): Rgb {
        const layers: Array<{ rgb: Rgb; alpha: number }> = []
        let current: Element | null = node
        while (current) {
          const { rgb, alpha } = readColour(getComputedStyle(current).backgroundColor)
          if (alpha > 0) {
            layers.push({ rgb, alpha })
            // An opaque layer hides everything beneath it.
            if (alpha >= 1) {
              current = null
              break
            }
          }
          current = current.parentElement
        }
        const last = layers[layers.length - 1]
        if (!last || last.alpha < 1) {
          layers.push({ rgb: [255, 255, 255], alpha: 1 })
        }
        let result = layers[layers.length - 1]!.rgb
        for (let i = layers.length - 2; i >= 0; i--) {
          result = over(layers[i]!, result)
        }
        return result
      }

      const asText = (rgb: Rgb) =>
        `rgb(${rgb.map((n) => Math.round(n)).join(', ')})`

      // Leaf text nodes only, so a paragraph is not measured twice, once by its
      // parent and once by its children.
      const nodes = Array.from(
        document.querySelectorAll(
          'p,li,dd,dt,figcaption,h1,h2,h3,h4,span,a,code,button,td,th,label'
        )
      ).filter(
        (node) =>
          node.textContent!.trim().length > 3 &&
          !node.querySelector('p,li,span,a,dd,dt,figcaption,td,th,button')
      )

      const bad: string[] = []
      const seen = new Set<string>()
      for (const node of nodes.slice(0, 600)) {
        const style = getComputedStyle(node)
        const size = parseFloat(style.fontSize) || 16
        const weight = Number(style.fontWeight) || 400
        // Large text is bold and at least 18.66 pixels, or at least 24 of any weight.
        const large = size >= 24 || (size >= 18.66 && weight >= 700)
        const need = large ? 3 : 4.5

        const text = readColour(style.color)
        const background = resolvedBackground(node)
        const got = ratio(text.rgb, background)
        if (got < need) {
          // One report per distinct colour pair, otherwise a footer link
          // repeated seven times buries the three real problems.
          const key = `${asText(text.rgb)}|${asText(background)}|${need}`
          if (seen.has(key)) continue
          seen.add(key)
          bad.push(
            `${node.tagName}.${String(node.className).slice(0, 24)} ${size}px ` +
              `${asText(text.rgb)} on ${asText(background)} = ${got.toFixed(2)}, ` +
              `needs ${need}, "${node.textContent!.trim().slice(0, 26)}"`
          )
        }
      }
      return { checked: Math.min(nodes.length, 600), bad }
    })

      expect(failures.bad, `on ${path}, checked ${failures.checked} nodes`).toEqual([])
    })
  }
})