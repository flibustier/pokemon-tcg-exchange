import {
  BrowserClient,
  captureException,
  dedupeIntegration,
  defaultStackParser,
  getCurrentScope,
  linkedErrorsIntegration,
  makeFetchTransport,
} from '@sentry/browser'

// Loaded by errors.ts after the first error only. This file keeps the same name from one deploy to
// the next (vite.config.ts), so a tab opened before a deploy can still load it.

const DSN = 'https://a49599109e28425ebd5605760102adfa@bug.cracking.ovh/1'

export const start = (currentPage: () => string) => {
  const client = new BrowserClient({
    dsn: DSN,
    environment: location.hostname === 'pokemon-tcg.exchange' ? 'production' : 'local',
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    // No breadcrumbs, no tracing, no replay: only the error itself
    integrations: [linkedErrorsIntegration(), dedupeIntegration()],
    // Nothing about the player: no user, cookies, headers, bodies or query strings
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    // Add the host to "Failed to fetch" in the report only: the app's own error stays the same
    enhanceFetchErrorMessages: 'report-only',
    beforeSend(event) {
      // The page by its pattern (/account/messages/:id), without query string: login links carry
      // an email and a token
      event.request = {
        url: location.origin + currentPage(),
        headers: { 'User-Agent': navigator.userAgent },
      }
      // A rejected API response is copied here in full: keep its keys only, they are in the title
      if (event.extra?.__serialized__) delete event.extra.__serialized__
      return event
    },
  })
  getCurrentScope().setClient(client)
  client.init()

  return (error: unknown, tags?: Record<string, string>) => captureException(error, { tags })
}
