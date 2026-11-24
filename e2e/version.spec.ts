import { test, expect, type Page, type Route } from '@playwright/test'

// version.json names the build online. The dev server has none: each test answers it, with a
// build newer than the one running unless told otherwise.
const NEWER = '2999-01-01T00:00:00.000Z'
const OLDER = '2000-01-01T00:00:00.000Z'

const MINUTE = 60 * 1000

const setUp = async (page: Page, online = NEWER) => {
  const checks: string[] = []
  await page.clock.install()
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.route('**/version.json*', (route) => {
    checks.push(route.request().url())
    return route.fulfill({ json: { build: online } })
  })
  return checks
}

// The app asked for version.json n times, and had the time to read the answer
const checked = async (page: Page, checks: string[], n: number) => {
  await expect.poll(() => checks.length).toBe(n)
  // nothing on the page shows that the answer was read: give it a moment
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(300)
}

// Gone once the page reloads
const mark = (page: Page) => page.evaluate(() => Object.assign(window, { sameDocument: true }))
const isSameDocument = (page: Page) =>
  page
    .evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument === true)
    // the page is being replaced right now
    .catch(() => false)

const leaveFor = async (page: Page, duration: number) => {
  const setVisibility = (state: DocumentVisibilityState) =>
    page.evaluate((visibility) => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => visibility,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    }, state)
  await setVisibility('hidden')
  await page.clock.fastForward(duration)
  await setVisibility('visible')
}

// Light pages: the home page draws every card, slow to open in WebKit under load
const toLogin = (page: Page) => page.getByRole('link', { name: 'Sign In' }).first().click()

const openHelp = async (page: Page) => {
  await page.goto('/help')
  await expect(page.locator('a.brand')).toBeVisible()
  await mark(page)
}

test.describe('a tab running an older build', () => {
  test('loads the newer build at the next page change', async ({ page }) => {
    const checks = await setUp(page)
    await openHelp(page)

    // Moving around asks for the build online, at most every 10 minutes
    await page.clock.fastForward(11 * MINUTE)
    await toLogin(page)
    await expect(page).toHaveURL(/\/login$/)
    await checked(page, checks, 1)
    expect(await isSameDocument(page)).toBe(true)

    // The next page comes from the server
    await page.getByRole('link', { name: 'Help & FAQ' }).first().click()
    await expect(page).toHaveURL(/\/help$/)
    await expect.poll(() => isSameDocument(page)).toBe(false)

    // Still an older build after the reload (here the dev server never changes): no loop
    await expect(page.locator('a.brand')).toBeVisible()
    await mark(page)
    await page.clock.fastForward(11 * MINUTE)
    await toLogin(page)
    await checked(page, checks, 2)
    await page.getByRole('link', { name: 'Help & FAQ' }).first().click()
    await expect(page).toHaveURL(/\/help$/)
    expect(await isSameDocument(page)).toBe(true)
  })

  test('reloads at once when back after an hour', async ({ page }) => {
    const checks = await setUp(page)
    await openHelp(page)

    await leaveFor(page, 61 * MINUTE)

    await expect.poll(() => checks.length).toBe(1)
    await expect.poll(() => isSameDocument(page)).toBe(false)
    await expect(page).toHaveURL(/\/help$/)
  })

  test('waits for a page change when back sooner', async ({ page }) => {
    const checks = await setUp(page)
    await openHelp(page)

    await leaveFor(page, 15 * MINUTE)
    await checked(page, checks, 1)
    expect(await isSameDocument(page)).toBe(true)

    await toLogin(page)
    await expect.poll(() => isSameDocument(page)).toBe(false)
    await expect(page).toHaveURL(/\/login$/)
  })

  test('stays when the build online is older', async ({ page }) => {
    const checks = await setUp(page, OLDER)
    await openHelp(page)

    await leaveFor(page, 61 * MINUTE)
    await checked(page, checks, 1)
    await toLogin(page)
    await expect(page).toHaveURL(/\/login$/)
    expect(await isSameDocument(page)).toBe(true)
  })

  test('keeps a page whose changes are not saved yet', async ({ page }) => {
    // the wish list draws every card
    test.slow()
    const checks = await setUp(page)
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT',
      'access-control-allow-headers': 'authorization, content-type, x-client-id',
    }
    const session = {
      friend_id: '1234567890123456',
      icon: '1',
      pseudo: 'Sacha',
      language: 'fr',
      wanted: '[]',
      giving: '[]',
      rarity_rules: '[]',
      jokers: '[]',
      joker_exclusions: '[]',
      has_beta_access: false,
      accept_notifications: true,
    }
    const saves: Route[] = []
    await page.route('http://localhost:8090/**', (route: Route) => {
      const request = route.request()
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
      if (new URL(request.url()).pathname === '/user/session') {
        return route.fulfill({ json: session, headers: cors })
      }
      // The save never comes back
      if (request.method() === 'PUT') return void saves.push(route)
      return route.fulfill({ json: [], headers: cors })
    })
    await page.addInitScript(() => {
      localStorage.setItem('token', 'dGVzdEB0ZXN0LmZyOmhhc2g=')
      localStorage.setItem(
        'user',
        '{"friend_id":"1234567890123456","pseudo":"Sacha","icon":"1","language":"fr"}',
      )
    })
    await page.goto('/account/wishlist')
    const card = page.locator('#C1 .card').first()
    await expect(card).toBeVisible({ timeout: 30000 })
    await mark(page)

    // A card added to the wish list, its save still on the way
    await card.locator('.card-image').click()
    await page.clock.fastForward(2000)
    await expect.poll(() => saves.length).toBe(1)

    await leaveFor(page, 61 * MINUTE)
    await checked(page, checks, 1)
    await page.locator('a.portfolio-btn', { hasText: 'Offers' }).click()
    await expect(page).toHaveURL(/\/account\/offers$/)
    expect(await isSameDocument(page)).toBe(true)
  })
})
