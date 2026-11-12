import { test, expect, type Page } from '@playwright/test'

// count.js is replaced by a stub that records what the app asks GoatCounter to count
// Like count.js, the stub keeps the settings the page declared before it.
const STUB =
  'window.goatcounter = Object.assign(window.goatcounter || {}, { count: (vars) => (window.counted ||= []).push(vars.path) })'

const stubAnalytics = (page: Page) =>
  page.route(
    (url) => url.hostname !== 'localhost',
    (route) =>
      route.request().url().endsWith('/count.js')
        ? route.fulfill({ contentType: 'text/javascript', body: STUB })
        : route.abort(),
  )

test('counts the pages visited inside the app, not the landing page', async ({ page }) => {
  await stubAnalytics(page)
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

test('counts the landing page without its parameters or player id', async ({ page }) => {
  await stubAnalytics(page)
  await page.goto('/help?email=someone%40example.com&token=secret')
  await page.waitForFunction(() => window.goatcounter?.count)

  // count.js calls this with the landing path and counts what it returns
  const counted = await page.evaluate(() => {
    const settings = window.goatcounter as unknown as { path: (path: string) => string }
    return [
      settings.path(location.pathname + location.search),
      settings.path('/account/messages/1234567890123456?i=1&p=2'),
      settings.path('/account/messages'),
    ]
  })
  expect(counted).toEqual(['/help', '/account/messages/:id', '/account/messages'])
})
