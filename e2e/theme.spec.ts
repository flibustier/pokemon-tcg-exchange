import { test, expect, type Page } from '@playwright/test'

const DARK_BACKGROUND = 'rgb(18, 21, 25)'
const LIGHT_BACKGROUND = 'rgb(255, 255, 255)'

const open = async (page: Page) => {
  // Nothing leaves the machine: no analytics hit, no call to a server
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.goto('/help')
}

const theme = (page: Page) => page.locator('html').getAttribute('data-theme')
const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)
const pickedTheme = (page: Page) => page.evaluate(() => localStorage.getItem('theme'))

test.describe('theme', () => {
  test.describe('on a dark system', () => {
    test.use({ colorScheme: 'dark' })

    test('follows the system, and keeps the light theme once picked', async ({ page }) => {
      await open(page)
      expect(await theme(page)).toBe('dark')
      await expect.poll(() => background(page)).toBe(DARK_BACKGROUND)

      await page.getByRole('button', { name: 'Switch to the light theme' }).click()
      expect(await theme(page)).toBe('light')
      await expect.poll(() => background(page)).toBe(LIGHT_BACKGROUND)
      expect(await pickedTheme(page)).toBe('light')

      // Set before the first paint: the page never shows the system's theme
      await page.reload()
      expect(await theme(page)).toBe('light')

      // Back to the system's theme: the choice is forgotten
      await page.getByRole('button', { name: 'Switch to the dark theme' }).click()
      expect(await theme(page)).toBe('dark')
      expect(await pickedTheme(page)).toBeNull()
    })
  })

  test.describe('on a light system', () => {
    test.use({ colorScheme: 'light' })

    test('switches to dark, then follows the system again', async ({ page }) => {
      await open(page)
      expect(await theme(page)).toBe('light')

      await page.getByRole('button', { name: 'Switch to the dark theme' }).click()
      expect(await theme(page)).toBe('dark')
      await expect.poll(() => background(page)).toBe(DARK_BACKGROUND)
      expect(await pickedTheme(page)).toBe('dark')

      await page.getByRole('button', { name: 'Switch to the light theme' }).click()
      expect(await pickedTheme(page)).toBeNull()
    })

    test.describe('on a phone', () => {
      test.use({ viewport: { width: 390, height: 844 } })

      test('offers the sign in, the help and the theme in the menu', async ({ page }) => {
        await open(page)
        await expect(page.getByRole('link', { name: 'Sign In' })).toBeHidden()

        await page.getByRole('button', { name: 'Menu' }).click()
        await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Help & FAQ' })).toBeVisible()

        // The menu stays open, showing the way back
        await page.getByRole('button', { name: 'Dark theme' }).click()
        expect(await theme(page)).toBe('dark')
        await expect(page.getByRole('button', { name: 'Light theme' })).toBeVisible()
      })

      test('offers the theme in the menu of a signed in player', async ({ page }) => {
        await page.route('http://localhost:8090/**', (route) =>
          route.fulfill({
            status: 200,
            json: [],
            headers: { 'access-control-allow-origin': '*' },
          }),
        )
        await page.addInitScript(() => localStorage.setItem('token', btoa('sacha@test.fr:hash')))
        await open(page)

        await page.getByRole('button', { name: 'Menu' }).click()
        await expect(page.getByRole('link', { name: 'Wishlist' })).toBeVisible()
        await page.getByRole('button', { name: 'Dark theme' }).click()
        expect(await theme(page)).toBe('dark')
      })
    })

    test('follows the system when it changes', async ({ page }) => {
      await open(page)
      await page.emulateMedia({ colorScheme: 'dark' })
      await expect.poll(() => theme(page)).toBe('dark')
      await page.emulateMedia({ colorScheme: 'light' })
      await expect.poll(() => theme(page)).toBe('light')
    })
  })
})
