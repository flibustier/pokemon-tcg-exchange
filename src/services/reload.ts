// After a deploy, a tab opened before keeps running the previous build: the pages and components
// it has not shown yet are files of that build. The deploy keeps them online for a week
// (scripts/keep-old-assets.sh); later, or on a network blip, loading one fails. Vite then fires a
// vite:preloadError event, and the import() rejects with the same error. Noted here, that error
// reloads the page on the current build (errors.ts) instead of leaving a page that does not open.

const loadErrors = new WeakSet<object>()
let reloading = false

// A load error soon after such a reload does not come from an old tab: the current build fails
// too, or the network does. Reloading again would loop, the error is reported instead.
const RELOADED_AT = 'reloadedAt'
const RELOAD_INTERVAL = 60 * 1000

export const watchLoadErrors = () =>
  window.addEventListener('vite:preloadError', (event) => {
    const { payload } = event as Event & { payload: unknown }
    if (payload instanceof Object) loadErrors.add(payload)
  })

export const isLoadError = (error: unknown) => error instanceof Object && loadErrors.has(error)

const reload = (url: string) => {
  if (!navigator.onLine) return false
  try {
    const reloadedAt = Number(sessionStorage.getItem(RELOADED_AT))
    if (Date.now() - reloadedAt < RELOAD_INTERVAL) return false
    sessionStorage.setItem(RELOADED_AT, String(Date.now()))
  } catch {
    // without sessionStorage, nothing would stop a reload loop
    return false
  }
  reloading = true
  // The page it was going to enters the history like a link, then reload() asks the server again:
  // assign() could take that page from the browser cache, with the files of the previous build
  if (new URL(url, location.href).href !== location.href) history.pushState(null, '', url)
  location.reload()
  return true
}

// True when the page reloads, for this load error or already: the error needs no report then. A
// navigation that fails reloads on the page it was going to (`url`), the router has not changed
// the URL yet.
export const reloadOnLoadError = (error: unknown, url = location.href) =>
  reloading || (isLoadError(error) && reload(url))
