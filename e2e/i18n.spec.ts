import { readFileSync, readdirSync } from 'node:fs'
import { test, expect, type Page, type Route } from '@playwright/test'

const LOCALES = new URL('../src/locales/', import.meta.url)
// The texts of the app are flat, those of the public pages (site/) are not: help.faq.list.0.question
const flatten = (value: unknown, key = ''): [string, string][] =>
  typeof value === 'string'
    ? [[key, value]]
    : Object.entries(value as object).flatMap(([name, inside]) =>
        flatten(inside, key ? `${key}.${name}` : name),
      )
const readTexts = (file: string): Record<string, string> =>
  Object.fromEntries(flatten(JSON.parse(readFileSync(new URL(file, LOCALES), 'utf8'))))

const session = {
  friend_id: '1234567890123456',
  email: 'sacha@test.fr',
  email_status: 'verified',
  icon: '1',
  pseudo: 'Sacha',
  language: 'FRA',
  wanted: JSON.stringify([{ id: 'A1-1', count: 1 }]),
  giving: JSON.stringify([{ id: 'A1-2', count: 1 }]),
  rarity_rules: '[]',
  jokers: '[]',
  joker_exclusions: '[]',
  has_beta_access: false,
  accept_notifications: true,
}

const proposal = {
  friend_id: '6543210987654321',
  icon: '2',
  pseudo: 'Ondine',
  language: 'ENG',
  card_wanted: 'A1-1',
  count_available: 1,
  card_to_give: 'A1-2',
  other_user_date: '2025-03-05 12:00:00',
  other_last_seen: '2025-03-05 12:00:00',
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE',
  'access-control-allow-headers': 'authorization, content-type, x-client-id',
}

type Handlers = Record<string, (route: Route) => unknown>

// The pages of a browser in these languages. Nothing leaves the machine: the API is answered here.
const prepare = async (page: Page, languages: string[], handlers: Handlers = {}) => {
  await page.addInitScript((tags) => {
    Object.defineProperty(navigator, 'languages', { get: () => tags })
  }, languages)
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.route('http://localhost:8090/**', (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    const { pathname } = new URL(request.url())
    const handler = handlers[`${request.method()} ${pathname}`]
    if (handler) return handler(route)
    if (pathname === '/user/session') return route.fulfill({ json: session, headers: cors })
    if (pathname === '/user/proposals') return route.fulfill({ json: [proposal], headers: cors })
    return route.fulfill({ json: [], headers: cors })
  })
}

const signIn = (page: Page) =>
  page.addInitScript(() => {
    localStorage.setItem('token', 'dGVzdEB0ZXN0LmZyOmhhc2g=')
    localStorage.setItem('user', '{"friend_id":"1234567890123456","pseudo":"Sacha","icon":"1"}')
  })

const signInHeading = (page: Page) => page.locator('.form h2')
const languageOfPage = (page: Page) => page.locator('html')

test.describe('texts', () => {
  const marks = (text: string) => ({
    placeholders: [...new Set(text.match(/\{\w+\}/g))].sort(),
    tags: (text.match(/<\/?\w+\/?>/g) ?? []).sort(),
    forms: text.split(' | ').length,
  })

  // Missing texts already fail the type check
  for (const folder of ['', 'site/']) {
    const english = readTexts(`${folder}en.json`)
    const files = readdirSync(new URL(folder, LOCALES)).filter((name) =>
      /^(?!en)\w+\.json$/.test(name),
    )

    for (const file of files) {
      test(`of ${folder}${file} have the keys, placeholders and tags of the English ones`, () => {
        const texts = readTexts(folder + file)
        expect(Object.keys(texts).sort()).toEqual(Object.keys(english).sort())
        for (const [key, text] of Object.entries(texts)) {
          expect({ key, ...marks(text) }).toEqual({ key, ...marks(english[key]) })
          expect(text.trim(), key).not.toBe('')
        }
      })
    }
  }
})

test.describe('language', () => {
  for (const { languages, lang, heading } of [
    { languages: ['en-US'], lang: 'en', heading: 'Sign in to your account' },
    { languages: ['es-MX', 'en'], lang: 'es', heading: 'Inicia sesión en tu cuenta' },
    { languages: ['fr-FR', 'en'], lang: 'fr', heading: 'Connecte-toi à ton compte' },
    { languages: ['it-IT'], lang: 'it', heading: 'Accedi al tuo account' },
    // The app has no Catalan and no German yet: the next language of the browser, or English
    { languages: ['ca', 'es', 'en'], lang: 'es', heading: 'Inicia sesión en tu cuenta' },
    { languages: ['de-DE'], lang: 'en', heading: 'Sign in to your account' },
    { languages: [], lang: 'en', heading: 'Sign in to your account' },
  ]) {
    test(`of a browser in [${languages}] is ${lang}`, async ({ page }) => {
      await prepare(page, languages)
      await page.goto('/login')

      await expect(signInHeading(page)).toHaveText(heading)
      await expect(languageOfPage(page)).toHaveAttribute('lang', lang)
    })
  }

  test('changes with the switcher, and stays after a reload', async ({ page }) => {
    await prepare(page, ['es-ES'])
    await page.goto('/login')
    await expect(signInHeading(page)).toHaveText('Inicia sesión en tu cuenta')

    await page.getByLabel('Idioma').selectOption('Français')
    await expect(signInHeading(page)).toHaveText('Connecte-toi à ton compte')
    await expect(languageOfPage(page)).toHaveAttribute('lang', 'fr')

    await page.reload()
    await expect(signInHeading(page)).toHaveText('Connecte-toi à ton compte')

    await page.getByLabel('Langue').selectOption('English')
    await expect(signInHeading(page)).toHaveText('Sign in to your account')
    await expect(languageOfPage(page)).toHaveAttribute('lang', 'en')
  })

  test('changes from the menu of small screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await prepare(page, ['en'])
    await page.goto('/login')
    await page.getByRole('button', { name: 'Menu' }).click()

    await page.locator('.mobile-menu-modal').getByLabel('Language').selectOption('Español')
    await expect(page.getByRole('link', { name: 'Ayuda' })).toBeVisible()
  })

  test('is English when the texts cannot be loaded', async ({ page }) => {
    await prepare(page, ['es-ES'])
    // The file of the dev server, or of a build
    await page.route(/\/locales\/es\.json|card-names\/es|\/assets\/es-/, (route) => route.abort())
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/login')

    await expect(signInHeading(page)).toHaveText('Sign in to your account')
    await expect(languageOfPage(page)).toHaveAttribute('lang', 'en')
    expect(errors).toEqual([])
  })
})

test.describe('in the language of the player', () => {
  test('the cards and the dates', async ({ page }) => {
    await prepare(page, ['fr-FR'])
    await signIn(page)
    await page.goto('/account/proposals')

    const tile = page.locator('.exchange-tile')
    await expect(tile.getByAltText('Bulbizarre')).toBeVisible()
    await expect(tile.getByAltText('Herbizarre')).toBeVisible()
    await expect(tile).toContainText('Mis à jour : 05 mars 2025')
  })

  for (const search of ['bulbizarre', 'Bulbasaur']) {
    test(`a card is found as ${search}`, async ({ page }) => {
      await prepare(page, ['fr-FR'])
      await signIn(page)
      await page.goto('/account/wishlist')

      await page.getByPlaceholder('Chercher une carte').fill(search)
      await expect(page.locator('#A1 .card:visible')).toHaveCount(2)
      await expect(page.locator('#A1 .card:visible').first()).toContainText('Bulbizarre')
    })
  }

  test('a card is found without its accents', async ({ page }) => {
    await prepare(page, ['fr-FR'])
    await signIn(page)
    await page.goto('/account/wishlist')

    await page.getByPlaceholder('Chercher une carte').fill('evoli')
    await expect(page.locator('#A1 .card:visible').first()).toContainText('Évoli')
  })

  test('the answers of the server', async ({ page }) => {
    await prepare(page, ['es-ES'], {
      'GET /user/session': (route) =>
        route.fulfill({ status: 401, body: 'invalid password', headers: cors }),
    })
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill('sacha@test.fr')
    await page.getByLabel('Contraseña').fill('password')
    await page.locator('button[type=submit]').click()

    await expect(page.getByText('Error: contraseña incorrecta')).toBeVisible()
    await expect(page.getByRole('link', { name: '¿Has olvidado tu contraseña?' })).toBeVisible()
  })

  test('the word to type to delete the account, the server still gets its own', async ({
    page,
  }) => {
    const bodies: unknown[] = []
    await prepare(page, ['es-ES'], {
      'DELETE /user/': (route) => {
        bodies.push(route.request().postDataJSON())
        return route.fulfill({ body: 'ko', headers: cors })
      },
    })
    await signIn(page)
    await page.goto('/account/settings')
    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click()

    const submit = page.getByRole('button', { name: 'Eliminar mi cuenta para siempre' })
    await page.getByLabel('Escribe ELIMINAR para confirmar').fill('DELETE')
    await expect(submit).toBeDisabled()
    await page.getByLabel('Escribe ELIMINAR para confirmar').fill('ELIMINAR')
    await submit.click()

    await expect(page.getByRole('alert')).toHaveText(
      'Error: el servidor está ocupado, vuelve a intentarlo',
    )
    expect(bodies).toEqual([{ confirm: 'DELETE' }])
  })
})

test.describe('public pages', () => {
  const hint = (page: Page) => page.locator('.language-hint:visible')

  test('offer the language of the browser, and keep the one picked', async ({ page }) => {
    await prepare(page, ['fr-FR', 'en'])
    await page.goto('/help')
    await expect(hint(page)).toHaveText('Cette page en français →')
    await hint(page).click()
    await expect(page).toHaveURL(/\/fr\/help$/)
    await expect(page.locator('h1')).toHaveText(
      'Comment échanger des cartes dans Pokémon TCG Pocket',
    )
    await expect(hint(page)).toHaveCount(0)

    // Picked: the page opens in it from now on, the app too
    await page.getByLabel('Langue').first().selectOption('Español')
    await expect(page).toHaveURL(/\/es\/help$/)
    await page.goto('/help#costs')
    await expect(page).toHaveURL(/\/es\/help#costs$/)
    await page.getByRole('link', { name: 'Iniciar sesión' }).first().click()
    await expect(signInHeading(page)).toHaveText('Inicia sesión en tu cuenta')

    // And back, from the app
    await page.getByRole('link', { name: 'Ayuda' }).first().click()
    await expect(page).toHaveURL(/\/es\/help$/)
  })

  test('offer nothing in the language of the page', async ({ page }) => {
    await prepare(page, ['de-DE', 'en', 'fr'])
    await page.goto('/help')
    await expect(page.locator('h1')).toBeVisible()
    await expect(hint(page)).toHaveCount(0)
  })

  test('do not lose a card changed just before', async ({ page }) => {
    // the wish list draws every card
    test.slow()
    const saves: unknown[] = []
    await prepare(page, ['en'], {
      'PUT /user/wishlist': (route) => {
        saves.push(route.request().postDataJSON())
        return route.fulfill({ body: 'updated', headers: cors })
      },
    })
    await signIn(page)
    await page.goto('/account/wishlist')
    const card = page.locator('#C1 .card').first()
    await expect(card).toBeVisible({ timeout: 30000 })
    await expect(page.locator('#A1 .card input').first()).toHaveValue('1')

    await card.locator('.card-image').click()
    await page.getByRole('link', { name: 'Help & FAQ' }).first().click()
    await expect(page).toHaveURL(/\/help$/, { timeout: 15000 })
    expect(saves).toEqual([expect.objectContaining({ id: 'C1-1', count: 1 })])
  })

  test('show the logo of a set in their language, or the English one', async ({ page }) => {
    await prepare(page, ['fr'])
    await page.goto('/fr/')
    const logos = page.locator('.sets img')
    await expect(page.locator('.sets img[src$="_A1_fr_FR.webp"]')).toHaveCount(1)

    // The database may have no French logo for the latest sets: each one shown exists
    for (const logo of await logos.all()) {
      await expect(logo).toHaveAttribute('src', /_(fr_FR|en_US)\.webp$/)
      await logo.scrollIntoViewIfNeeded()
      await expect
        .poll(() => logo.evaluate((image) => (image as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0)
    }
  })

  test('lead to the cards to choose, and a player to their proposals', async ({ page }) => {
    // /start draws every card
    test.slow()
    await prepare(page, ['en'])
    await page.goto('/')
    await page.getByRole('link', { name: 'Choose my cards' }).first().click()
    await expect(page).toHaveURL(/\/start$/)
    await expect(page.getByText('Select the cards you are looking for')).toBeVisible({
      timeout: 30000,
    })

    await signIn(page)
    await page.goto('/es/')
    await expect(page).toHaveURL(/\/account\/proposals$/)
  })
})
