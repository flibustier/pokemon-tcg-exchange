import { test, expect } from '@playwright/test'

test('shows the cards on the home page', async ({ page }) => {
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.goto('/')

  await expect(page.getByText('Pocket Exchange Center')).toBeVisible()
  await expect(page.locator('.card-grid .card').first()).toBeVisible()
  await expect(page.locator('.input-search')).toHaveCount(1)
})
