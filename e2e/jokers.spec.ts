import { test, expect, type Page, type Route } from '@playwright/test'

// The offers page of a signed-in player: A1-1 is wanted, the ◆ joker of A1 is on, and A1-6 is
// left out of it.
const session = {
  friend_id: '1234567890123456',
  icon: '1',
  pseudo: 'Sacha',
  language: 'fr',
  wanted: JSON.stringify([{ id: 'A1-1', count: 1 }]),
  giving: JSON.stringify([{ id: 'A1-2', count: 1 }]),
  rarity_rules: '[]',
  jokers: JSON.stringify([{ set: 'A1', rarity: 'C' }]),
  joker_exclusions: JSON.stringify(['A1-6']),
  has_beta_access: false,
  accept_notifications: true,
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT',
  'access-control-allow-headers': 'authorization, content-type, x-client-id',
}

type Save = { path: string; body: Record<string, unknown> }

// Answers like the server, and records the saves
const mockApi = async (page: Page, sessionBody: Record<string, unknown> = session) => {
  const saves: Save[] = []
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.route('http://localhost:8090/**', (route: Route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())

    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (pathname === '/user/session') {
      return route.fulfill({ status: 200, json: sessionBody, headers: cors })
    }
    if (request.method() === 'PUT') {
      saves.push({ path: pathname, body: request.postDataJSON() })
      return route.fulfill({ status: 200, body: 'updated', headers: cors })
    }
    return route.fulfill({ status: 200, json: [], headers: cors })
  })
  return saves
}

const signIn = (page: Page) =>
  page.addInitScript(() => {
    localStorage.setItem('token', 'dGVzdEB0ZXN0LmZyOmhhc2g=')
    localStorage.setItem(
      'user',
      '{"friend_id":"1234567890123456","pseudo":"Sacha","icon":"1","language":"fr"}',
    )
  })

const card = (page: Page, set: string, number: number) =>
  page.locator(`#${set} .card`).filter({
    has: page.locator('.card-number', { hasText: String(number).padStart(3, '0') }),
  })

const openOffers = async (page: Page, sessionBody?: Record<string, unknown>) => {
  await signIn(page)
  const saves = await mockApi(page, sessionBody)
  await page.goto('/account/offers')
  await expect(page.locator('.all-sets-jokers')).toBeVisible()
  return saves
}

test.describe('jokers', () => {
  test('show which cards a joker gives', async ({ page }) => {
    await openOffers(page)

    await expect(page.locator('#A1 .set-jokers [data-rarity="C"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.locator('#A1 .set-jokers [data-rarity="U"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    // A1-5 ◆ is given by the joker. A1-1 is wanted, A1-2 has a count, A1-6 is left out
    await expect(card(page, 'A1', 5).locator('.joker-badge')).toHaveText('🃏 Joker')
    await expect(card(page, 'A1', 1).locator('.joker-badge')).toHaveCount(0)
    await expect(card(page, 'A1', 2).locator('.joker-badge')).toHaveCount(0)
    await expect(card(page, 'A1', 2).getByLabel('Number of cards')).toHaveValue('1')
    await expect(card(page, 'A1', 6).locator('.joker-badge')).toHaveText('Left out')
    // ◆◆ has no joker in A1
    await expect(card(page, 'A1', 3).locator('.joker-badge')).toHaveCount(0)

    // The bar for every set sits above the header. Each set shows its divider, the first one
    // too, even SP1 which has no ◆ card, so the bar does not read as its own.
    const bottomOfBar = await page
      .locator('.all-sets-jokers')
      .evaluate((bar) => bar.getBoundingClientRect().bottom)
    const topOfHeader = await page
      .locator('.set-header')
      .evaluate((header) => header.getBoundingClientRect().top)
    expect(bottomOfBar).toBeLessThanOrEqual(topOfHeader)
    await expect(page.locator('#SP1 .set-divider')).toBeVisible()
    await expect(page.locator('#SP1 .set-jokers')).toHaveCount(0)
    await expect(page.locator('#C1 .set-jokers button')).toHaveCount(4)
  })

  // C1 is the first set with ◆ cards, right under the header. A set further down needs a long
  // scroll, and Firefox may drop a click sent right after it, probably while the cards drawn by
  // the scroll still move the page: it works after a pause of a second.
  test('turns the joker of a set on, then leaves a card out', async ({ page }) => {
    const saves = await openOffers(page)

    await page.locator('#C1 .set-jokers [data-rarity="C"]').click()
    await expect.poll(() => saves.length).toBe(1)
    expect(saves[0]).toEqual({
      path: '/user/jokers',
      body: { sets: ['C1'], rarity: 'C', enabled: true },
    })
    await expect(card(page, 'C1', 1).locator('.joker-badge')).toHaveText('🃏 Joker')

    await card(page, 'C1', 1).locator('.card-image').click()
    await expect.poll(() => saves.length).toBe(2)
    expect(saves[1]).toEqual({
      path: '/user/jokers/exclusions',
      body: { id: 'C1-1', excluded: true },
    })
    await expect(card(page, 'C1', 1).locator('.joker-badge')).toHaveText('Left out')
  })

  test('turns a rarity on in every set with one request', async ({ page }) => {
    const saves = await openOffers(page)

    await expect(page.locator('.all-sets-jokers [data-rarity="C"]')).toHaveAttribute(
      'aria-pressed',
      'mixed',
    )
    await page.locator('.all-sets-jokers [data-rarity="C"]').click()
    await expect.poll(() => saves.length).toBe(1)

    const { path, body } = saves[0]
    expect(path).toBe('/user/jokers')
    expect(body).toMatchObject({ rarity: 'C', enabled: true })
    const sets = body.sets as string[]
    // A1 was already on. SP1 has no ◆ card, and promos cannot be traded
    expect(sets).toContain('A2')
    expect(sets).toContain('C1')
    expect(sets).not.toContain('A1')
    expect(sets).not.toContain('SP1')
    expect(sets.some((set) => set.startsWith('PROMO'))).toBe(false)
    await expect(page.locator('.all-sets-jokers [data-rarity="C"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('stay off the wish list, and off a server without jokers', async ({ page }) => {
    await openOffers(page)
    await page.goto('/account/wishlist')
    await expect(page.locator('.set-divider').first()).toBeAttached()
    await expect(page.locator('.set-jokers, .all-sets-jokers, .joker-badge')).toHaveCount(0)
    // The header shows the first set's logo, its divider stays hidden as before
    await expect(page.locator('#SP1 .set-divider')).toBeHidden()

    // A server older than the jokers
    const olderSession: Record<string, unknown> = { ...session }
    delete olderSession.jokers
    delete olderSession.joker_exclusions
    await page.unrouteAll()
    await mockApi(page, olderSession)
    await page.goto('/account/offers')
    await expect(card(page, 'A1', 5)).toBeAttached()
    await expect(page.locator('.set-jokers, .all-sets-jokers, .joker-badge')).toHaveCount(0)
  })
})
