import type { App } from 'vue'
import type { Router } from 'vue-router'
import { BUGSINK_DSN } from '@/../config.json' with { type: 'json' }
import { pagePath } from './analytics'
import { isLoadError, reloadOnLoadError, watchLoadErrors } from './reload'

// Errors in the browser are sent to Bugsink (https://bug.cracking.ovh), which speaks the Sentry
// protocol. The Sentry SDK weighs about 20 KB gzipped, so it is only downloaded after the first
// error: a visit without errors costs nothing. Only production builds report, and only with a
// BUGSINK_DSN in config.json: leave it empty and the build has no SDK. A page or a component of an
// older build that fails to load reloads the page instead (reload.ts).

type Send = (error: unknown, tags?: Record<string, string>) => void

let sdk: Promise<Send> | undefined
let currentPage = () => location.pathname

const report = (error: unknown, tags?: Record<string, string>) => {
  // An empty DSN is known at build time: the import() of errors-sdk.ts is dropped
  if (!BUGSINK_DSN) return
  // a reload did not help: the current build fails too, or the network does
  if (isLoadError(error)) tags = { ...tags, reload: 'skipped' }
  sdk ??= import('./errors-sdk').then(({ start }) => start(BUGSINK_DSN, () => currentPage()))
  // If the SDK can't be loaded (offline…), there is nothing more to do
  sdk.then((send) => send(error, tags)).catch(() => {})
}

const handle = (error: unknown) => {
  if (!reloadOnLoadError(error)) report(error)
}

export const trackErrors = (app: App, router: Router) => {
  if (!import.meta.env.PROD) return

  watchLoadErrors()
  currentPage = () => pagePath(router.currentRoute.value)

  // `error` without an Error object is a cross-origin "Script error.", which tells nothing
  window.addEventListener('error', (event) => event.error && handle(event.error))
  window.addEventListener('unhandledrejection', (event) => handle(event.reason))

  // Vue only logs an error when no handler is set: keep the log in the console
  app.config.errorHandler = (error, _instance, info) => {
    if (reloadOnLoadError(error)) return
    console.error(error)
    report(error, { vue: info })
  }
  router.onError((error, to) => {
    if (!reloadOnLoadError(error, router.resolve(to.fullPath).href)) {
      report(error, { router: 'navigation' })
    }
  })
}
