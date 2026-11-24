import type { Router } from 'vue-router'
import { hasUnsavedChanges } from './api'
import { loadFromServer } from './reload'

// A tab can stay open for weeks (a phone keeps it in the background) and keep running the build it
// loaded. Its catalogue then misses the cards released since, and it may call routes the server
// changed: on 2026-11-23, such a tab sent C1 cards without their rarity and every save failed.
//
// So the tab asks which build is online (version.json, written by vite.config.ts) when it comes
// back to the foreground, and from time to time while the player moves from page to page. Once a
// newer build is online, the next page change loads it from the server instead. A tab back after a
// long absence reloads at once: the player has not started anything yet. Neither happens while
// changes are not saved: the reload would lose them.

const CHECK_INTERVAL = 10 * 60 * 1000
const LONG_ABSENCE = 60 * 60 * 1000
// The build a reload went for. If the tab still runs an older one afterwards (a cached page),
// reloading again would loop: it waits for a build newer than that one.
const RELOADED_FOR = 'reloadedForBuild'

let newerBuild: string | undefined
let lastCheck = Date.now()
let hiddenAt: number | undefined

const reloadedFor = () => {
  try {
    return sessionStorage.getItem(RELOADED_FOR) ?? ''
  } catch {
    return undefined
  }
}

const check = async () => {
  if (Date.now() - lastCheck < CHECK_INTERVAL) return
  lastCheck = Date.now()
  try {
    // no-store and a query that changes: neither the browser nor GitHub's cache answers
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    const { build } = await response.json()
    // ISO dates: an older build online (a cache lagging behind) must not send the tab back to it
    if (typeof build === 'string' && build > __BUILD_ID__) newerBuild = build
  } catch {
    // offline, or no version.json (the dev server): try again later
  }
}

const canReload = () => {
  const done = reloadedFor()
  // without sessionStorage, nothing would stop a reload loop
  if (!newerBuild || done === undefined || newerBuild <= done) return false
  return !hasUnsavedChanges()
}

const reloadOn = (url: string) => {
  try {
    sessionStorage.setItem(RELOADED_FOR, newerBuild!)
  } catch {
    return
  }
  loadFromServer(url)
}

// A message, a search or a login being typed would be lost: wait for the next page change then
const TEXT_FIELDS = ['text', 'search', 'email', 'password', 'url', 'tel', 'textarea']
const isTyping = () =>
  [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('textarea, input')].some(
    (field) => TEXT_FIELDS.includes(field.type) && field.value !== '',
  )

const onVisibilityChange = async () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now()
    return
  }
  const away = hiddenAt === undefined ? 0 : Date.now() - hiddenAt
  hiddenAt = undefined
  await check()
  if (away >= LONG_ABSENCE && canReload() && !isTyping()) reloadOn(location.href)
}

export const watchNewBuilds = (router: Router) => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  // A page back from the back-forward cache may not say it came back to the foreground
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) onVisibilityChange()
  })

  router.beforeEach((to) => {
    if (!canReload()) return
    reloadOn(router.resolve(to.fullPath).href)
    return false
  })
  router.afterEach(() => {
    check()
  })
}
