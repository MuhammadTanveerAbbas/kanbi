import { test, expect } from '@playwright/test'

test('landing page loads with a title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Kanbi/)
})

test('landing page renders its primary heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1').first()).toBeVisible()
})

test('pricing page is reachable directly', async ({ page }) => {
  const response = await page.goto('/pricing')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveURL(/\/pricing/)
})

test('legal pages render', async ({ page }) => {
  for (const path of ['/privacy', '/terms']) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
  }
})

test('dashboard redirects an unauthenticated visitor to sign in', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/sign-in/)
})

test('the sign-in page renders its form', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('an unknown route returns the not found page', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist')
  expect(response?.status()).toBe(404)
})

test('sitemap lists only public pages', async ({ page }) => {
  const response = await page.goto('/sitemap.xml')
  expect(response?.status()).toBe(200)
  const body = await response?.text()
  expect(body).toContain('/pricing')
  expect(body).toContain('/changelog')
  // The dashboard is authenticated and must not be advertised for indexing.
  expect(body).not.toContain('/dashboard')
})

test('the changelog page is reachable without signing in', async ({ page }) => {
  const response = await page.goto('/changelog')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveURL(/\/changelog/)
  await expect(page.getByRole('heading', { name: 'Changelog', level: 1 })).toBeVisible()
})

test('the changelog page shows the current version and a latest badge', async ({ page }) => {
  await page.goto('/changelog')
  await expect(page.getByText('Latest').first()).toBeVisible()
  await expect(page.getByText('3.2.0').first()).toBeVisible()
})

test('the changelog filter narrows the entries shown', async ({ page }) => {
  await page.goto('/changelog')

  const securityFilter = page.getByRole('button', { name: /^Security/ })
  await expect(securityFilter).toBeVisible()

  // The page is server rendered and hydrates client side, so a click dispatched
  // before hydration is lost. toPass retries the click until the state actually
  // changes, which makes the test deterministic instead of timing dependent.
  await expect(async () => {
    await securityFilter.click()
    await expect(securityFilter).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 })
  }).toPass({ timeout: 10_000 })

  // Every remaining badge must be Security, and no Fixed entries are left.
  const badges = page.locator('.badge')
  await expect(page.getByText('Fixed', { exact: true })).toHaveCount(0)
  const count = await badges.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await expect(badges.nth(i)).toHaveText('Security')
  }
})

test('the changelog can be reached from the site footer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Changelog' }).first().click()
  await expect(page).toHaveURL(/\/changelog/)
})

/**
 * Responsive checks. Each viewport is exercised against the real rendered page,
 * because a layout that only works at desktop width is a defect rather than a
 * cosmetic issue.
 */
const VIEWPORTS = [
  { name: 'small mobile', width: 360, height: 740 },
  { name: 'large mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1600, height: 900 },
]

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow on ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/changelog')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow, `horizontal overflow of ${overflow}px at ${vp.width}px`).toBeLessThanOrEqual(1)
  })
}

test('changelog filters are keyboard operable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/changelog')

  const filter = page.getByRole('button', { name: /^Added/ })
  await filter.focus()
  // Same hydration race as the click test, so retry until the keypress lands.
  await expect(async () => {
    await filter.focus()
    await page.keyboard.press('Enter')
    await expect(filter).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 })
  }).toPass({ timeout: 10_000 })

  const badges = page.locator('.badge')
  const count = await badges.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await expect(badges.nth(i)).toHaveText('Added')
  }
})

test('changelog back link shows a visible focus indicator', async ({ page }) => {
  await page.goto('/changelog')
  const back = page.getByRole('link', { name: /Back to home/ })
  await back.focus()
  const outline = await back.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')
})
