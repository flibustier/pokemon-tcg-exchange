import { test, expect } from '@playwright/test'

// count.js is replaced by a stub that records what the app asks GoatCounter to count
const STUB = 'window.goatcounter = { count: (vars) => (window.counted ||= []).push(vars.path) }'

test('counts the pages visited inside the app, not the landing page', async ({ page }) => {
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) =>
      route.request().url().endsWith('/count.js')
        ? route.fulfill({ contentType: 'text/javascript', body: STUB })
        : route.abort(),
  )
  await page.goto('/')
  await expect(page.locator('.card-grid .card').first()).toBeVisible()
  await page.waitForFunction(() => window.goatcounter?.count)

  await page.getByRole('link', { name: 'Help & FAQ' }).first().click()
  await expect(page).toHaveURL(/\/help$/, { timeout: 15000 })
  await page.locator('a.brand').click()
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 })

  const counted = await page.evaluate(() => (window as unknown as { counted?: string[] }).counted)
  expect(counted).toEqual(['/help', '/'])
})
