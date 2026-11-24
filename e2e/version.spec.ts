import { test, expect, type Page, type Route } from '@playwright/test'

// version.json names the build online. The dev server has none: each test answers it. The app asks
// at start: an older build is online then, and the test publishes a newer one later.
const NEWER = '2999-01-01T00:00:00.000Z'
const OLDER = '2000-01-01T00:00:00.000Z'

const MINUTE = 60 * 1000

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT',
  'access-control-allow-headers': 'authorization, content-type, x-client-id',
}

const SESSION = {
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

const signIn = (page: Page) =>
  page.addInitScript(() => {
    localStorage.setItem('token', 'dGVzdEB0ZXN0LmZyOmhhc2g=')
    localStorage.setItem(
      'user',
      '{"friend_id":"1234567890123456","pseudo":"Sacha","icon":"1","language":"fr"}',
    )
  })

const setUp = async (page: Page, build = OLDER) => {
  const checks: string[] = []
  const online = { build }
  await page.clock.install()
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.route('**/version.json*', (route) => {
    checks.push(route.request().url())
    return route.fulfill({ json: { build: online.build } })
  })
  return { checks, online }
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

// Another page of the app. Light ones: the home page draws every card, slow to open in WebKit under
// load.
const goTo = (page: Page, path: string) =>
  page.evaluate((to) => {
    const { __vue_app__: app } = document.querySelector('#app') as unknown as {
      __vue_app__: { config: { globalProperties: { $router: { push: (to: string) => void } } } }
    }
    app.config.globalProperties.$router.push(to)
  }, path)
const toLogin = (page: Page) => goTo(page, '/login')

// The app is there, no longer what the HTML shows in the meantime
const appShown = (page: Page) => expect(page.locator('h1.brand-name')).toBeVisible()

// Opens a page while the build running is the one online, then publishes a newer one
const openApp = async (
  page: Page,
  { checks, online }: { checks: string[]; online: { build: string } },
  published = NEWER,
) => {
  await page.goto('/forgotten-password')
  await appShown(page)
  await checked(page, checks, 1)
  online.build = published
  await mark(page)
}

test.describe('a tab running an older build', () => {
  test('loads the newer build at the next page change', async ({ page }) => {
    const server = await setUp(page)
    const { checks } = server
    await openApp(page, server)

    // Moving around asks for the build online, at most every 10 minutes
    await page.clock.fastForward(11 * MINUTE)
    await toLogin(page)
    await expect(page).toHaveURL(/\/login$/)
    await checked(page, checks, 2)
    expect(await isSameDocument(page)).toBe(true)

    // The next page comes from the server
    await goTo(page, '/forgotten-password')
    await expect(page).toHaveURL(/\/forgotten-password$/)
    await expect.poll(() => isSameDocument(page)).toBe(false)

    // Still an older build after the reload (here the dev server never changes): no loop
    await appShown(page)
    await mark(page)
    await page.clock.fastForward(11 * MINUTE)
    await toLogin(page)
    await checked(page, checks, 4)
    await goTo(page, '/forgotten-password')
    await expect(page).toHaveURL(/\/forgotten-password$/)
    expect(await isSameDocument(page)).toBe(true)
  })

  test('reloads at once when back after an hour', async ({ page }) => {
    const server = await setUp(page)
    const { checks } = server
    await openApp(page, server)

    await leaveFor(page, 61 * MINUTE)

    await expect.poll(() => checks.length).toBeGreaterThanOrEqual(2)
    await expect.poll(() => isSameDocument(page)).toBe(false)
    await expect(page).toHaveURL(/\/forgotten-password$/)
  })

  test('waits for a page change when back sooner', async ({ page }) => {
    const server = await setUp(page)
    const { checks } = server
    await openApp(page, server)

    await leaveFor(page, 15 * MINUTE)
    await checked(page, checks, 2)
    expect(await isSameDocument(page)).toBe(true)

    await toLogin(page)
    await expect.poll(() => isSameDocument(page)).toBe(false)
    await expect(page).toHaveURL(/\/login$/)
  })

  test('stays when the build online is older', async ({ page }) => {
    const server = await setUp(page)
    const { checks } = server
    await openApp(page, server, OLDER)

    await leaveFor(page, 61 * MINUTE)
    await checked(page, checks, 2)
    await toLogin(page)
    await expect(page).toHaveURL(/\/login$/)
    expect(await isSameDocument(page)).toBe(true)
  })

  test('keeps a page whose changes are not saved yet', async ({ page }) => {
    // the wish list draws every card
    test.slow()
    const { checks, online } = await setUp(page)
    const saves: Route[] = []
    await page.route('http://localhost:8090/**', (route: Route) => {
      const request = route.request()
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
      if (new URL(request.url()).pathname === '/user/session') {
        return route.fulfill({ json: SESSION, headers: CORS })
      }
      // The save never comes back
      if (request.method() === 'PUT') return void saves.push(route)
      return route.fulfill({ json: [], headers: CORS })
    })
    await signIn(page)
    await page.goto('/account/wishlist')
    const card = page.locator('#C1 .card').first()
    await expect(card).toBeVisible({ timeout: 30000 })
    await checked(page, checks, 1)
    online.build = NEWER
    await mark(page)

    // A card added to the wish list, its save still on the way
    await card.locator('.card-image').click()
    await page.clock.fastForward(2000)
    await expect.poll(() => saves.length).toBe(1)

    await leaveFor(page, 61 * MINUTE)
    await checked(page, checks, 2)
    await page.locator('a.portfolio-btn', { hasText: 'Offers' }).click()
    await expect(page).toHaveURL(/\/account\/offers$/)
    expect(await isSameDocument(page)).toBe(true)
  })

  // A phone that closed the tab in the background starts the app again from its cache, old build
  // included: on 2026-11-23, every save failed from the first second.
  test('reloads by itself when the app starts on an older build', async ({ page }) => {
    const { checks } = await setUp(page, NEWER)
    let documents = 0
    page.on('request', (request) => {
      if (request.resourceType() === 'document') documents++
    })
    await page.goto('/forgotten-password')

    await expect.poll(() => documents).toBe(2)
    // Once only: the dev server still runs the older build
    await appShown(page)
    await checked(page, checks, 2)
    expect(documents).toBe(2)
  })

  test('waits for the session before reloading a player at start', async ({ page }) => {
    await setUp(page, NEWER)
    const order: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'document') order.push('document')
    })
    await page.route('http://localhost:8090/**', async (route: Route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS })
      }
      if (new URL(route.request().url()).pathname !== '/user/session') {
        return route.fulfill({ json: [], headers: CORS })
      }
      await new Promise((resolve) => setTimeout(resolve, 1500))
      order.push('session')
      return route.fulfill({ json: SESSION, headers: CORS })
    })
    await signIn(page)
    await page.goto('/account/settings')

    await expect
      .poll(() => order.slice(0, 3), { timeout: 15000 })
      .toEqual(['document', 'session', 'document'])
  })

  test('leaves a player who already started something', async ({ page }) => {
    const { checks } = await setUp(page, NEWER)
    await page.addInitScript(() =>
      document.addEventListener('DOMContentLoaded', () =>
        window.dispatchEvent(new Event('pointerdown')),
      ),
    )
    await page.goto('/forgotten-password')
    await appShown(page)
    await mark(page)
    await checked(page, checks, 1)
    expect(await isSameDocument(page)).toBe(true)

    await toLogin(page)
    await expect.poll(() => isSameDocument(page)).toBe(false)
    await expect(page).toHaveURL(/\/login$/)
  })

  test('keeps a text being typed, back after an hour', async ({ page }) => {
    const server = await setUp(page)
    await page.goto('/login')
    await checked(page, server.checks, 1)
    server.online.build = NEWER
    await mark(page)
    await page.locator('input[type="email"]').first().fill('someone@example.com')

    await leaveFor(page, 61 * MINUTE)
    await checked(page, server.checks, 2)
    expect(await isSameDocument(page)).toBe(true)
  })
})
