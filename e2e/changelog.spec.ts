import { test, expect, devices } from '@playwright/test'

/**
 * Changelog page, checked in a real browser.
 *
 * The charts on this page are hand drawn SVG, which is the kind of thing that
 * looks fine in a screenshot at one width and spills off the edge at another.
 * These tests measure the document rather than trusting the layout, so a
 * regression shows up as a number instead of as a shrug.
 */

const VIEWPORTS = [
  { name: 'desktop wide', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'tablet narrow', width: 768, height: 1024 },
  { name: 'phone large', width: 430, height: 932 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone small', width: 320, height: 640 },
]

test.describe('changelog layout', () => {
  for (const viewport of VIEWPORTS) {
    test(`fits without horizontal scroll at ${viewport.name}, ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/changelog')
      await expect(page.locator('h1')).toBeVisible()

      const overflow = await page.evaluate(() => {
        const el = document.documentElement
        return {
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          // Anything genuinely wider than the viewport, ignoring the page shell
          // which is allowed to be exactly viewport wide.
          wide: Array.from(document.querySelectorAll('*'))
            .filter((node) => {
              const r = node.getBoundingClientRect()
              return r.width > el.clientWidth + 2
            })
            .slice(0, 5)
            .map((node) => `${node.tagName}.${String(node.className).slice(0, 40)}`),
        }
      })

      expect(overflow.wide, `elements wider than ${viewport.width}px`).toEqual([])
      expect(
        overflow.scrollWidth,
        `horizontal scrollbar at ${viewport.width}px`
      ).toBeLessThanOrEqual(overflow.clientWidth + 1)
    })
  }

  test('charts scale down rather than being clipped', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/changelog')

    const chart = page.locator('svg.chart').first()
    await expect(chart).toBeVisible()

    const box = await chart.boundingBox()
    expect(box).not.toBeNull()
    // The SVG has no width and no height in CSS, so it fills its column and
    // keeps the viewBox ratio. A fixed pixel height here would break that.
    expect(box!.width).toBeLessThanOrEqual(390)
    expect(box!.height).toBeGreaterThan(50)
  })

  test('the data table is readable on a phone and scrolls rather than overflowing', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/changelog')

    await page.getByRole('button', { name: /show the numbers/i }).click()
    const table = page.locator('table.data-table')
    await expect(table).toBeVisible()

    // The wrapper scrolls, so the table itself is allowed to be wider.
    const wrapper = page.locator('.table-wrap')
    const clipped = await wrapper.evaluate((el) => {
      const style = getComputedStyle(el)
      return style.overflowX
    })
    expect(clipped).toBe('auto')
  })
})

test.describe('changelog charts', () => {
  test('every chart carries a text description for a screen reader', async ({ page }) => {
    await page.goto('/changelog')
    const charts = page.locator('svg[role="img"]')
    const count = await charts.count()
    expect(count).toBeGreaterThanOrEqual(3)

    for (let i = 0; i < count; i++) {
      const label = await charts.nth(i).getAttribute('aria-label')
      expect(label?.trim().length ?? 0).toBeGreaterThan(10)
    }
  })

  test('the tooltip appears on hover and reports real numbers', async ({ page }) => {
    await page.goto('/changelog')
    const firstBar = page.locator('svg.chart g rect.hit').first()
    await firstBar.hover()

    const tip = page.locator('.chart-tip').first()
    await expect(tip).toBeVisible()
    await expect(tip).toContainText('commits')
  })

  test('the change mix totals match the release notes', async ({ page }) => {
    await page.goto('/changelog')

    const printed = Number(
      // SVG text has no innerText, only textContent.
      (await page.locator('.donut-num').textContent())!.trim()
    )

    // The legend is the source of truth for the slices, so summing it and
    // comparing against the centre catches an arc that is drawn at the wrong
    // size even though the picture looks plausible.
    const legendTotal = await page
      .locator('.legend.tall li')
      .evaluateAll((items) =>
        items.reduce((sum, li) => sum + Number(li.querySelector('.legend-num')!.textContent), 0)
      )

    expect(printed).toBe(legendTotal)
    expect(printed).toBeGreaterThan(20)

    // The same total must reach a screen reader, not just the visual centre.
    const label = await page.locator('svg.donut').getAttribute('aria-label')
    const described = Array.from(label!.matchAll(/(\d+) (added|fixed|changed|security|removed)/g))
    expect(described.length).toBeGreaterThanOrEqual(3)
    const labelTotal = described.reduce((sum, m) => sum + Number(m[1]), 0)
    expect(labelTotal).toBe(printed)
  })
})

test.describe('changelog theme', () => {
  test('follows the stored choice in both directions', async ({ page }) => {
    await page.goto('/changelog')
    const shell = page.locator('.cl-page')

    const read = () =>
      page.evaluate(() => {
        const el = document.querySelector('.cl-page')!
        return {
          attr: el.getAttribute('data-theme'),
          // The custom property is the real signal. Reading the painted colour
          // mid transition returns an interpolated value that matches neither
          // theme and makes this test fail for no reason.
          bgVar: getComputedStyle(el).getPropertyValue('--bg').trim(),
          stored: localStorage.getItem('kanbi-theme'),
        }
      })

    const first = await read()
    await page.getByRole('button', { name: /switch to/i }).click()
    const second = await read()

    expect(first.attr).not.toBe(second.attr)
    expect(first.bgVar).not.toBe(second.bgVar)
    expect(second.stored).toBe(second.attr)

    // And the page really repaints, not just relabels itself.
    if (second.attr === 'dark') {
      await expect(shell).toHaveCSS('background-color', 'rgb(7, 7, 11)')
    } else {
      await expect(shell).toHaveCSS('background-color', 'rgb(242, 243, 251)')
    }
  })

  test('remembers the choice across a reload', async ({ page }) => {
    await page.goto('/changelog')
    await page.getByRole('button', { name: /switch to/i }).click()
    const chosen = await page
      .locator('.cl-page')
      .getAttribute('data-theme')

    await page.reload()
    await expect(page.locator('.cl-page')).toHaveAttribute('data-theme', chosen!)
  })

  test('honours the operating system preference when nothing is stored', async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme: 'dark' })
    const page = await context.newPage()
    await page.goto('/changelog')
    await expect(page.locator('.cl-page')).toHaveAttribute('data-theme', 'dark')
    await context.close()

    const light = await browser.newContext({ colorScheme: 'light' })
    const lightPage = await light.newPage()
    await lightPage.goto('/changelog')
    await expect(lightPage.locator('.cl-page')).toHaveAttribute('data-theme', 'light')
    await light.close()
  })

  test('the changelog theme matches the landing page theme', async ({ page }) => {
    await page.goto('/changelog')
    await page.getByRole('button', { name: /switch to/i }).click()
    const chosen = await page.locator('.cl-page').getAttribute('data-theme')

    await page.goto('/')
    const onLanding = await page.evaluate(() =>
      localStorage.getItem('kanbi-theme')
    )
    expect(onLanding).toBe(chosen)
  })
})

test.describe('changelog content', () => {
  test('filters narrow the list and the active filter is announced', async ({ page }) => {
    await page.goto('/changelog')
    const releases = page.locator('section.release')

    const before = await releases.count()
    expect(before).toBeGreaterThan(3)

    // The page opens on "Everything", so Fixed starts inactive.
    const fixed = page.getByRole('button', { name: /^Fixed/ })
    const everything = page.getByRole('button', { name: /^Everything/ })
    await expect(everything).toHaveAttribute('aria-pressed', 'true')
    await expect(fixed).toHaveAttribute('aria-pressed', 'false')

    await fixed.click()
    await expect(fixed).toHaveAttribute('aria-pressed', 'true')
    await expect(everything).toHaveAttribute('aria-pressed', 'false')

    const after = await releases.count()
    expect(after).toBeLessThan(before)
    expect(after).toBeGreaterThan(0)

    // Everything under the active filter must actually be labelled "Fixed",
    // otherwise the button is lying about what it did.
    const badges = await page.locator('.badge').allInnerTexts()
    expect(badges.length).toBeGreaterThan(0)
    for (const badge of badges) expect(badge.trim().toUpperCase()).toBe('FIXED')

    await everything.click()
    await expect(releases).toHaveCount(before)
  })

  test('shows the built with row with real brand marks', async ({ page }) => {
    await page.goto('/changelog')
    const chips = page.locator('.chip')
    expect(await chips.count()).toBeGreaterThanOrEqual(5)
    // Each chip draws an inline SVG rather than showing an emoji.
    expect(await page.locator('.chip svg').count()).toBeGreaterThanOrEqual(5)
  })

  test('reads as a single column on a phone', async ({ page }) => {
    await page.setViewportSize({ ...devices['iPhone 13'].viewport })
    await page.goto('/changelog')
    const columns = await page
      .locator('.chart-grid')
      .first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    expect(columns).toBe(1)
  })

  test('keeps badge text legible on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/changelog')
    const badge = page.locator('.badge').first()
    await expect(badge).toBeVisible()
    const box = await badge.boundingBox()
    expect(box!.width).toBeGreaterThan(40)
  })
})