import { test, expect, type Page, type Route, type Request } from '@playwright/test'

const FRIEND_ID = '1234567890123456'
const HASH = 'hash'

const session = (emailStatus: string, email = 'sacha@test.fr') => ({
  friend_id: FRIEND_ID,
  email,
  email_status: emailStatus,
  icon: '1',
  pseudo: 'Sacha',
  language: 'FRA',
  wanted: JSON.stringify([{ id: 'A1-1', count: 1 }]),
  giving: JSON.stringify([{ id: 'A1-2', count: 1 }]),
  rarity_rules: '[]',
  has_beta_access: true,
  accept_notifications: true,
})

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE',
  'access-control-allow-headers': 'authorization, content-type, x-client-id',
}

type Handler = (route: Route, request: Request) => unknown

// Answers the API with `handlers` by "METHOD /path", an empty list otherwise. Nothing leaves
// the machine: no analytics hit, no call to a real server.
const mockApi = async (page: Page, handlers: Record<string, Handler>) => {
  const calls: { key: string; body: unknown; auth: string | undefined }[] = []
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  await page.route('http://localhost:8090/**', (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })

    const key = `${request.method()} ${new URL(request.url()).pathname}`
    calls.push({ key, body: request.postDataJSON(), auth: request.headers()['authorization'] })
    const handler = handlers[key]
    if (handler) return handler(route, request)

    return route.fulfill({ status: 200, json: [], headers: cors })
  })
  return calls
}

const text =
  (body: string, status = 200) =>
  (route: Route) =>
    route.fulfill({ status, body, headers: cors })
const json = (body: unknown) => (route: Route) =>
  route.fulfill({ status: 200, json: body, headers: cors })

const signIn = (page: Page, emailStatus: string) =>
  page.addInitScript(
    ({ token, user }) => {
      // Once per tab: a test that logs out must stay logged out after the next page load
      if (sessionStorage.getItem('signed-in')) return
      sessionStorage.setItem('signed-in', '1')
      localStorage.setItem('token', token)
      localStorage.setItem('wanted_cards', '{"A1-1":1}')
      localStorage.setItem('giving_cards', '{"A1-2":1}')
      localStorage.setItem('user', JSON.stringify(user))
    },
    {
      token: Buffer.from(`sacha@test.fr:${HASH}`).toString('base64'),
      user: {
        friend_id: FRIEND_ID,
        pseudo: 'Sacha',
        icon: '1',
        language: 'FRA',
        email: 'sacha@test.fr',
        email_status: emailStatus,
      },
    },
  )

const loginOf = (page: Page) =>
  page.evaluate(() => {
    const token = localStorage.getItem('token')
    return token && atob(token)
  })

test.describe('email confirmation', () => {
  test('confirms the token of the link and removes it from the address', async ({ page }) => {
    const calls = await mockApi(page, { 'POST /confirm_email': text('confirmed') })
    const token = 'a'.repeat(64)

    await page.goto(`/confirm-email#token=${token}`)

    await expect(page.getByRole('heading', { name: 'Your email is confirmed!' })).toBeVisible()
    expect(calls.find(({ key }) => key === 'POST /confirm_email')?.body).toEqual({ token })
    expect(page.url()).not.toContain(token)
  })

  test('offers a new mail when the link expired', async ({ page }) => {
    await signIn(page, 'pending')
    const calls = await mockApi(page, {
      'GET /user/session': json(session('pending')),
      'POST /confirm_email': text('invalid or expired link', 400),
      'POST /user/confirmation_email': text('sent'),
    })

    await page.goto(`/confirm-email#token=${'b'.repeat(64)}`)
    await expect(
      page.getByRole('heading', { name: 'This link is invalid or expired' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Send a new email' }).click()

    await expect(page.getByText('A new email is on its way!')).toBeVisible()
    expect(calls.some(({ key }) => key === 'POST /user/confirmation_email')).toBe(true)
  })

  test('shows the banner to a pending player only', async ({ page }) => {
    await signIn(page, 'legacy')
    await mockApi(page, { 'GET /user/session': json(session('legacy')) })
    await page.goto('/account/settings')
    await expect(page.getByLabel('Pseudonym (14 characters max)')).toBeVisible()
    await expect(page.getByText('Please confirm your email')).toBeHidden()
  })

  test('fixes a mistyped address and signs in with the new one', async ({ page }) => {
    await signIn(page, 'pending')
    const calls = await mockApi(page, {
      'GET /user/session': json(session('pending')),
      'PUT /user/email': text('updated'),
    })

    await page.goto('/account/settings')
    await expect(page.getByText('we sent a link to sacha@test.fr')).toBeVisible()
    await page.getByRole('button', { name: 'Wrong address? Change it' }).click()
    await page.getByLabel('New email address').fill(' Sacha@Pallet.fr ')
    await page.getByRole('status').getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Email updated')).toBeVisible()
    expect(calls.find(({ key }) => key === 'PUT /user/email')?.body).toEqual({
      email: 'sacha@pallet.fr',
    })
    expect(await loginOf(page)).toBe(`sacha@pallet.fr:${HASH}`)
  })

  test('hides the banner when the player confirmed elsewhere, without reloading the cards', async ({
    page,
  }) => {
    await signIn(page, 'pending')
    let status = 'pending'
    await mockApi(page, {
      // Once confirmed, the server has other cards than this tab, which didn't save its own yet
      'GET /user/session': (route) =>
        route.fulfill({
          status: 200,
          json: { ...session(status), ...(status === 'verified' && { wanted: '[]' }) },
          headers: cors,
        }),
    })

    await page.goto('/account/settings')
    await expect(page.getByText('Please confirm your email')).toBeVisible()
    const cardsBefore = await page.evaluate(() => localStorage.getItem('wanted_cards'))

    status = 'verified'
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))

    await expect(page.getByText('Please confirm your email')).toBeHidden()
    expect(await page.evaluate(() => localStorage.getItem('wanted_cards'))).toBe(cardsBefore)
  })

  test('cannot write messages before confirming', async ({ page }) => {
    await signIn(page, 'pending')
    await mockApi(page, {
      'GET /user/session': json(session('pending')),
      'GET /user/discussions': json([
        {
          friend_id: '9999999999999999',
          pseudo: 'Ondine',
          avatar: '',
          language: 'FRA',
          last_message: 'hello',
          last_message_date: '2026-11-14 10:00:00',
          read: true,
          deleted: false,
        },
      ]),
    })

    await page.goto('/account/messages/9999999999999999')

    await expect(page.getByText('Please confirm your email to send messages')).toBeVisible()
    await expect(page.getByPlaceholder('Write a message...')).toHaveCount(0)
  })
})

test.describe('deleted players', () => {
  test('a conversation with a deleted player is read-only', async ({ page }) => {
    await signIn(page, 'legacy')
    await mockApi(page, {
      'GET /user/session': json(session('legacy')),
      'GET /user/discussions': json([
        {
          friend_id: 'deleted-42',
          pseudo: null,
          avatar: null,
          language: null,
          last_message: 'see you',
          last_message_date: '2026-11-14 10:00:00',
          read: true,
          deleted: true,
        },
      ]),
      'GET /user/messages/deleted-42': json([
        {
          from: 'deleted-42',
          to: 'me',
          message: 'see you',
          sent: '2026-11-14 10:00:00',
          read: null,
        },
      ]),
    })

    await page.goto('/account/messages/deleted-42')

    await expect(page.locator('.chat-messages').getByText('see you')).toBeVisible()
    await expect(page.locator('.chat-header').getByText('Deleted player')).toBeVisible()
    await expect(page.locator('.discussion-item').getByText('Deleted player')).toBeVisible()
    await expect(page.getByText('This player deleted their account')).toBeVisible()
    await expect(page.getByPlaceholder('Write a message...')).toHaveCount(0)
    await expect(page.locator('button.send')).toHaveCount(0)
  })
})

test.describe('account deletion', () => {
  test('deletes the account once DELETE is typed, then logs out', async ({ page }) => {
    await signIn(page, 'verified')
    const calls = await mockApi(page, {
      'GET /user/session': json(session('verified')),
      'DELETE /user/': text('deleted'),
    })

    await page.goto('/account/settings')
    await expect(page.getByText('Email (confirmed)')).toBeVisible()
    await page.getByRole('button', { name: 'Delete my account' }).click()

    const confirm = page.getByRole('button', { name: 'Delete my account for good' })
    await expect(confirm).toBeDisabled()
    await page.getByLabel('Type DELETE to confirm').fill('delete')
    await expect(confirm).toBeDisabled()
    await page.getByLabel('Type DELETE to confirm').fill('DELETE')
    await confirm.click()

    await page.waitForURL((url) => url.pathname === '/')
    expect(calls.find(({ key }) => key === 'DELETE /user/')?.body).toEqual({ confirm: 'DELETE' })
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()
  })

  test('keeps the player signed in when the deletion fails', async ({ page }) => {
    await signIn(page, 'verified')
    await mockApi(page, {
      'GET /user/session': json(session('verified')),
      'DELETE /user/': text('ko', 500),
    })

    await page.goto('/account/settings')
    await page.getByRole('button', { name: 'Delete my account' }).click()
    await page.getByLabel('Type DELETE to confirm').fill('DELETE')
    await page.getByRole('button', { name: 'Delete my account for good' }).click()

    await expect(page.getByRole('alert').getByText('the server is busy')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('token'))).not.toBeNull()
  })
})
