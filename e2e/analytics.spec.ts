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
  await page.goto('/forgotten-password')
  await expect(page.locator('h1.brand-name')).toBeVisible()
  await page.waitForFunction(() => window.goatcounter?.count)

  await page.getByRole('link', { name: 'Sign In' }).first().click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/forgotten-password$/)

  const counted = await page.evaluate(() => (window as unknown as { counted?: string[] }).counted)
  expect(counted).toEqual(['/login', '/forgotten-password'])
})

test('counts the landing page without its parameters or player id', async ({ page }) => {
  await stubAnalytics(page)
  await page.goto('/help?email=someone%40example.com&token=secret')
  await page.waitForFunction(() => window.goatcounter?.count)

  // count.js calls this with the landing path, the canonical link's when there is one, and counts
  // what it returns
  const counted = await page.evaluate(() => {
    const settings = window.goatcounter as unknown as { path: (path: string) => string }
    const countAt = (address: string, path = address) => {
      history.replaceState(null, '', address)
      return settings.path(path)
    }
    return [
      settings.path(location.pathname + location.search),
      countAt('/account/messages/1234567890123456?i=1&p=2'),
      countAt('/account/messages'),
      // A player sent from / to their proposals, with the canonical link of / still there
      countAt('/account/proposals', '/'),
    ]
  })
  expect(counted).toEqual([
    '/help',
    '/account/messages/:id',
    '/account/messages',
    '/account/proposals',
  ])
})

// What a script of analytics can read of the sign-in link, when it runs and later
const LINK_STUB = `
  const read = () => (window.read ||= []).push(location.href, document.referrer)
  read()
  addEventListener('load', read)
`

const openSignInLink = async (page: Page, online = () => true) => {
  const logins: (string | undefined)[] = []
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) =>
      route.request().url().endsWith('.js')
        ? route.fulfill({ contentType: 'text/javascript', body: LINK_STUB })
        : route.abort(),
  )
  await page.route('http://localhost:8090/**', (route) => {
    const { pathname } = new URL(route.request().url())
    if (pathname === '/user/session') logins.push(route.request().headers().authorization)
    if (!online()) return route.abort()
    // Refused: the page stays on the sign-in form
    return route.fulfill({
      status: route.request().method() === 'OPTIONS' ? 204 : 401,
      body: 'insufficient credentials',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization, content-type, x-client-id',
      },
    })
  })
  await page.goto('/login?email=someone%2Btcg%40example.com&token=secret')
  await expect.poll(() => logins.length).toBeGreaterThan(0)
  return logins
}

test('a sign-in link signs in, and analytics cannot read it', async ({ page }) => {
  const logins = await openSignInLink(page)

  expect(atob(logins[0]!.replace('Basic ', ''))).toBe('someone+tcg@example.com:secret')
  await page.waitForFunction(() => (window as unknown as { read?: string[] }).read?.length)
  const read = await page.evaluate(() => (window as unknown as { read: string[] }).read)
  expect(read.join(' ')).not.toMatch(/secret|someone/)
  expect(page.url()).toMatch(/\/login$/)
})

test('a refused sign-in link is not used again', async ({ page }) => {
  await openSignInLink(page)
  await page.waitForFunction(() => localStorage.getItem('token') === null)

  await page.reload()
  await expect(page.locator('#email')).toBeVisible()
  // The form signs in when it appears: the login is stored by then
  const stored = await page.evaluate(() => [
    localStorage.getItem('token'),
    sessionStorage.getItem('signInLink'),
  ])
  expect(stored).toEqual([null, null])
})

test('a sign-in link survives a reload that cuts the sign-in', async ({ page }) => {
  let online = false
  const logins = await openSignInLink(page, () => online)
  const [login] = logins
  logins.length = 0

  online = true
  // A reload that comes before the login is stored
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect.poll(() => logins).toContain(login)
})
