import { test, expect, type Page } from '@playwright/test'

// The head of each page (services/head.ts). That it is in the HTML before any JavaScript is checked
// by the build itself (vite.config.ts).
const SITE = 'https://pokemon-tcg.exchange'
const DEFAULT_TITLE = 'Pokemon TCG Pocket Exchange Center - Trade Your Cards with the World'

const blockOtherHosts = (page: Page) =>
  page.route(
    (url) => url.hostname !== 'localhost' || url.port === '8090',
    (route) => route.abort(),
  )

const canonical = (page: Page) => page.locator('link[rel="canonical"]')
const robots = (page: Page) => page.locator('meta[name="robots"]')

test.describe('head', () => {
  test.beforeEach(({ page }) => blockOtherHosts(page))

  for (const { path, title } of [
    { path: '/login', title: 'Sign in - Pokemon TCG Pocket Exchange Center' },
    {
      path: '/help',
      title: 'How to trade and exchange your Pokemon TCG Pocket cards with our hub',
    },
  ]) {
    test(`${path} has its own title and address`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveTitle(title)
      await expect(canonical(page)).toHaveAttribute('href', SITE + path)
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', SITE + path)
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
      await expect(page.locator('meta[name="description"]')).toHaveCount(1)
      await expect(robots(page)).toHaveCount(0)
    })
  }

  test('leaves a page without its own title out of search engines', async ({ page }) => {
    await page.goto('/help')
    await expect(canonical(page)).toHaveCount(1)

    await page.getByRole('link', { name: 'Sign In' }).first().click()
    await expect(canonical(page)).toHaveAttribute('href', SITE + '/login')

    await page.goto('/forgotten-password')
    await expect(page).toHaveTitle(DEFAULT_TITLE)
    await expect(robots(page)).toHaveAttribute('content', 'noindex')
    await expect(canonical(page)).toHaveCount(0)
  })

  test('still sends a visitor of an account page to the sign-in page', async ({ page }) => {
    await page.goto('/account/proposals')
    await expect(page).toHaveURL(/\/login$/)
    await expect(canonical(page)).toHaveAttribute('href', SITE + '/login')
  })
})
