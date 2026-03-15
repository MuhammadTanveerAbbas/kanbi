import { test, expect } from '@playwright/test'

test('landing page loads successfully', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Kanbi/)
})

test('can navigate to login', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/login"]')
  await expect(page).toHaveURL(/\/login/)
})
