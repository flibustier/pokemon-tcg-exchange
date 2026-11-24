import { readFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'

// What search engines and link previews read, in the HTML itself: without JavaScript
const SITE = 'https://pokemon-tcg.exchange'
const DEFAULT_TITLE = 'Pokemon TCG Pocket Exchange Center - Trade Your Cards with the World'

const titleOf = (page: 'home' | 'help', locale: string): string =>
  JSON.parse(readFileSync(new URL(`../src/locales/site/${locale}.json`, import.meta.url), 'utf8'))[
    page
  ].title

const blockOtherHosts = (page: Page) =>
  page.route(
    (url) => url.hostname !== 'localhost' || url.port === '8090',
    (route) => route.abort(),
  )

const canonical = (page: Page) => page.locator('link[rel="canonical"]')
const robots = (page: Page) => page.locator('meta[name="robots"]')
const meta = (page: Page, name: string) => page.locator(`meta[property="${name}"]`)

test.describe('head', () => {
  test.use({ javaScriptEnabled: false })
  test.beforeEach(({ page }) => blockOtherHosts(page))

  for (const { path, title, lang = 'en' } of [
    { path: '/', title: titleOf('home', 'en') },
    { path: '/fr/', title: titleOf('home', 'fr'), lang: 'fr' },
    { path: '/login', title: 'Sign in - Pokemon TCG Pocket Exchange Center' },
    { path: '/help', title: titleOf('help', 'en') },
    { path: '/es/help', title: titleOf('help', 'es'), lang: 'es' },
    { path: '/fr/help', title: titleOf('help', 'fr'), lang: 'fr' },
  ]) {
    test(`${path} has its own title and address`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveTitle(title)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(canonical(page)).toHaveAttribute('href', SITE + path)
      await expect(meta(page, 'og:url')).toHaveAttribute('content', SITE + path)
      await expect(meta(page, 'og:title')).toHaveAttribute('content', title)
      await expect(page.locator('meta[name="description"]')).toHaveCount(1)
      await expect(robots(page)).toHaveAttribute('content', 'all')
    })
  }

  for (const path of ['/help', '/es/help', '/fr/help']) {
    test(`${path} names the page in the other languages`, async ({ page }) => {
      await page.goto(path)
      for (const [language, address] of [
        ['en', '/help'],
        ['es', '/es/help'],
        ['fr', '/fr/help'],
        ['x-default', '/help'],
      ]) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveAttribute(
          'href',
          SITE + address,
        )
      }
    })
  }

  for (const path of ['/account/proposals', '/forgotten-password', '/start', '/logout', '/nope']) {
    test(`${path} is not for search engines`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveTitle(DEFAULT_TITLE)
      await expect(robots(page)).toHaveAttribute('content', 'noindex')
      await expect(canonical(page)).toHaveCount(0)
    })
  }

  test('the sitemap lists the public pages, with their languages', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, address]) => address)
    for (const path of ['/login', '/', '/es/', '/fr/', '/help', '/es/help', '/fr/help', '/sets/']) {
      expect(listed).toContain(SITE + path)
    }
    expect(listed).toContain(`${SITE}/sets/dual-fusion`)
    expect(new Set(listed).size).toBe(listed.length)
    expect(sitemap).toContain(`hreflang="fr" href="${SITE}/fr/help"`)
  })
})

test('sends a visitor of an account page to the sign-in page', async ({ page }) => {
  await blockOtherHosts(page)
  await page.goto('/account/proposals')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page).toHaveTitle('Sign in - Pokemon TCG Pocket Exchange Center')
})

test('the page of a set lists its cards, without the totals of the server', async ({ page }) => {
  await blockOtherHosts(page)
  await page.goto('/sets/')
  await page.getByRole('link', { name: 'Dual Fusion' }).click()
  await expect(page).toHaveURL(/\/sets\/dual-fusion$/)
  await expect(page.locator('h1')).toHaveText('Trade Dual Fusion cards')
  await expect(page.getByRole('row', { name: '015 Ribombee 1,200 150' })).toBeVisible()
  // The dev server does not read them
  await expect(page.getByText('Wanted by')).toHaveCount(0)

  await page.getByRole('link', { name: 'Choose the cards I want' }).click()
  await expect(page).toHaveURL(/\/start#C1$/)
})
