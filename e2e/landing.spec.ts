import { test, expect } from '@playwright/test'

test('landing page loads successfully', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/KANBI - AI Task Management/)
})

test('pricing page is accessible', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Navigate directly to pricing page
  await page.goto('/pricing')
  await expect(page).toHaveURL(/\/pricing/)
})
