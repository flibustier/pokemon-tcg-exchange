import { test, expect, type Page, type Route } from '@playwright/test'

const session = {
  friend_id: '1234567890123456',
  icon: '1',
  pseudo: 'Sacha',
  language: 'fr',
  wanted: JSON.stringify([
    { id: 'SP1-1', count: 1 },
    { id: 'A2-156', count: 1 },
  ]),
  giving: JSON.stringify([
    { id: 'SP1-2', count: 1 },
    { id: 'A2-157', count: 1 },
  ]),
  rarity_rules: '[]',
  jokers: '[]',
  joker_exclusions: '[]',
  has_beta_access: false,
  accept_notifications: true,
}

const proposal = (wanted: string, given: string) => ({
  friend_id: '6543210987654321',
  icon: '2',
  pseudo: 'Ondine',
  language: 'en',
  card_wanted: wanted,
  count_available: 1,
  card_to_give: given,
  other_user_date: '2026-11-20 10:00:00',
  other_last_seen: '2026-11-21 10:00:00',
})

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT',
  'access-control-allow-headers': 'authorization, content-type, x-client-id',
}

const openProposals = async (page: Page, proposals: unknown[]) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'dGVzdEB0ZXN0LmZyOmhhc2g=')
    localStorage.setItem(
      'user',
      '{"friend_id":"1234567890123456","pseudo":"Sacha","icon":"1","language":"fr"}',
    )
  })
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.route('http://localhost:8090/**', (route: Route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (pathname === '/user/session') return route.fulfill({ json: session, headers: cors })
    if (pathname === '/user/proposals') return route.fulfill({ json: proposals, headers: cors })
    return route.fulfill({ json: [], headers: cors })
  })
  await page.goto('/account/proposals')
}

const cardsOf = (tile: ReturnType<Page['locator']>, side: number) =>
  tile.locator('.cards').nth(side).locator('img')

test.describe('proposals', () => {
  // SP1-1/SP1-2 and A2-156/A2-157 are all ◇ AR, but an SP1 card only trades for an SP1 card
  test('keep SP1 trades apart from the other cards of the same rarity', async ({ page }) => {
    await openProposals(page, [proposal('SP1-1', 'SP1-2'), proposal('A2-156', 'A2-157')])

    const tiles = page.locator('.exchange-tile')
    await expect(tiles).toHaveCount(2)
    for (const [index, wanted, given] of [
      [0, 'SP1/1.webp', 'SP1/2.webp'],
      [1, 'A2/156.webp', 'A2/157.webp'],
    ] as const) {
      await expect(cardsOf(tiles.nth(index), 0)).toHaveCount(1)
      await expect(cardsOf(tiles.nth(index), 0)).toHaveAttribute('src', new RegExp(wanted))
      await expect(cardsOf(tiles.nth(index), 1)).toHaveCount(1)
      await expect(cardsOf(tiles.nth(index), 1)).toHaveAttribute('src', new RegExp(given))
    }
  })

  test('still group the cards of one rarity in a single tile', async ({ page }) => {
    await openProposals(page, [proposal('A2-156', 'A2-157'), proposal('A2-158', 'A2-157')])

    await expect(page.locator('.exchange-tile')).toHaveCount(1)
    await expect(cardsOf(page.locator('.exchange-tile'), 0)).toHaveCount(2)
  })
})
