import { test, expect, type Page, type Route } from '@playwright/test'

const session = {
  friend_id: '1234567890123456',
  icon: '1',
  pseudo: 'Sacha',
  language: 'fr',
  wanted: JSON.stringify([{ id: 'A1-1', count: 1 }]),
  giving: JSON.stringify([{ id: 'A1-2', count: 1 }]),
  rarity_rules: '[]',
  has_beta_access: false,
  accept_notifications: true,
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT',
  'access-control-allow-headers': 'authorization, content-type, x-client-id',
}

const reply = (route: Route, status: number, body: string) =>
  route.fulfill({ status, body, headers: cors })

const sessionOk = (route: Route) => route.fulfill({ status: 200, json: session, headers: cors })

const mockApi = async (
  page: Page,
  onSession: (route: Route) => unknown,
  onSave: (route: Route) => unknown = (route) => reply(route, 200, 'updated'),
) => {
  // Nothing leaves the machine: no analytics hit, no call to a real server.
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.route('http://localhost:8090/**', (route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())

    if (request.method() === 'OPTIONS') return reply(route, 204, '')
    if (pathname === '/user/session') return onSession(route)
    const isSave = ['/user/', '/user/wishlist', '/user/offers'].includes(pathname)
    if (isSave && request.method() === 'PUT') return onSave(route)

    return route.fulfill({ status: 200, json: [], headers: cors })
  })
}

const signIn = (page: Page) =>
  page.addInitScript(() => {
    localStorage.setItem('token', 'dGVzdEB0ZXN0LmZyOmhhc2g=')
    localStorage.setItem('wanted_cards', '{"A1-1":1}')
    localStorage.setItem('giving_cards', '{"A1-2":1}')
    localStorage.setItem(
      'user',
      '{"friend_id":"1234567890123456","pseudo":"Sacha","icon":"1","language":"fr"}',
    )
  })

// The app asks for the discussions right after importing the session: from then on, a change
// of cards is no longer overwritten by the session. Waiting for the session response is not
// enough, the app may not have handled it yet (and Firefox lets tests see the CORS preflight).
const sessionImported = (page: Page) =>
  page.waitForRequest(
    (request) => request.url().endsWith('/user/discussions') && request.method() === 'GET',
  )

const sessionFailed = (page: Page) =>
  page.waitForResponse(
    (response) => response.url().endsWith('/user/session') && response.request().method() === 'GET',
  )

const isLoggedInAfterLoading = async (page: Page) => {
  const sessionCall = page.waitForEvent('requestfinished', (request) =>
    request.url().endsWith('/user/session'),
  )
  await page.goto('/help')
  await sessionCall
  await page.waitForTimeout(300)

  return page.evaluate(() => localStorage.getItem('token') !== null)
}

test.describe('session', () => {
  test('stays logged in when the server fails', async ({ page }) => {
    await signIn(page)
    await mockApi(page, (route) => reply(route, 500, 'ko'))

    expect(await isLoggedInAfterLoading(page)).toBe(true)
    expect(await page.evaluate(() => localStorage.getItem('wanted_cards'))).toBe('{"A1-1":1}')
  })

  test('stays logged in when the network fails', async ({ page }) => {
    await signIn(page)
    await mockApi(page, (route) => route.abort())
    await page.goto('/help')

    await page.waitForTimeout(500)
    expect(await page.evaluate(() => localStorage.getItem('token'))).not.toBeNull()
  })

  test('logs out when the credentials are refused', async ({ page }) => {
    await signIn(page)
    await mockApi(page, (route) => reply(route, 401, 'invalid password'))

    expect(await isLoggedInAfterLoading(page)).toBe(false)
  })
})

test.describe('login', () => {
  const submit = async (page: Page) => {
    await page.goto('/login')
    await page.locator('#email').fill('sacha@test.fr')
    await page.locator('#password').fill('pikachu-pikachu')
    await page.locator('button[type=submit]').click()
  }

  test('does not offer to create an account when the server fails', async ({ page }) => {
    await mockApi(page, (route) => reply(route, 500, 'ko'))
    await submit(page)

    await expect(page.getByText('the server is busy')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible()
  })

  test('offers to create an account for an unknown user', async ({ page }) => {
    await mockApi(page, (route) => reply(route, 401, 'insufficient credentials'))
    await submit(page)

    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })
})

test.describe('saving cards', () => {
  const alert = (page: Page) => page.getByRole('alert')

  const changeCard = async (page: Page, { sessionFails = false } = {}) => {
    const sessionCall = sessionFails ? sessionFailed(page) : sessionImported(page)
    await page.goto('/account/wishlist')
    await sessionCall
    await page.locator('.card:not(:has(.card-decoration)) .card-image').first().click()
  }

  test('warns the player, then retries until it works', async ({ page }) => {
    // A failed save is retried after 10 s
    test.setTimeout(45000)
    let saves = 0

    await signIn(page)
    await mockApi(page, sessionOk, (route) => {
      saves++
      return saves === 1 ? reply(route, 500, 'ko') : reply(route, 200, 'updated')
    })
    await changeCard(page)

    // Firefox with the dev server takes a few seconds to send the save
    await expect(alert(page)).toBeVisible({ timeout: 10000 })
    await expect(alert(page)).toBeHidden({ timeout: 20000 })
    expect(saves).toBe(2)
  })

  test('does not retry when the credentials are refused', async ({ page }) => {
    // A failed save is retried after 10 s
    test.setTimeout(45000)
    let saves = 0

    await signIn(page)
    await mockApi(page, sessionOk, (route) => {
      saves++
      return reply(route, 401, 'invalid password')
    })
    await changeCard(page)

    // Firefox with the dev server takes a few seconds to send the save
    await expect(alert(page)).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(11000)
    expect(saves).toBe(1)
  })

  test('shows nothing when the save works', async ({ page }) => {
    let saves = 0

    await signIn(page)
    await mockApi(page, sessionOk, (route) => {
      saves++
      return reply(route, 200, 'updated')
    })
    await changeCard(page)

    await expect.poll(() => saves).toBe(1)
    await expect(alert(page)).toBeHidden()
  })

  test('sends only the card that changed', async ({ page }) => {
    const saves: { path: string; body: unknown }[] = []

    await signIn(page)
    await mockApi(page, sessionOk, (route) => {
      const request = route.request()
      saves.push({ path: new URL(request.url()).pathname, body: request.postDataJSON() })
      return reply(route, 200, 'updated')
    })
    await changeCard(page)

    await expect.poll(() => saves.length).toBe(1)
    expect(saves[0].path).toBe('/user/wishlist')
    const body = saves[0].body as { id: string; count: number; set: string; number: number }
    expect(body.count).toBe(1)
    expect(body.id).toBe(`${body.set}-${body.number}`)
    await page.waitForTimeout(1500)
    expect(saves.length).toBe(1)
  })

  test('sends the whole collection when many cards changed', async ({ page }) => {
    const saves: string[] = []

    await signIn(page)
    await mockApi(page, sessionOk, (route) => {
      saves.push(new URL(route.request().url()).pathname)
      return reply(route, 200, 'updated')
    })
    const sessionCall = sessionImported(page)
    await page.goto('/account/wishlist')
    await sessionCall
    await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.card:not(:has(.card-decoration)) .card-image')]
        .slice(0, 25)
        .forEach((image) => image.click()),
    )

    await expect.poll(() => saves.length).toBe(1)
    expect(saves[0]).toBe('/user/')
  })

  test('sends the whole collection until the session is loaded', async ({ page }) => {
    const saves: string[] = []

    await signIn(page)
    await mockApi(
      page,
      (route) => reply(route, 500, 'ko'),
      (route) => {
        saves.push(new URL(route.request().url()).pathname)
        return reply(route, 200, 'updated')
      },
    )
    await changeCard(page, { sessionFails: true })

    await expect.poll(() => saves.length).toBe(1)
    expect(saves[0]).toBe('/user/')
  })
})
