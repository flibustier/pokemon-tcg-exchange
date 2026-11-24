import type { Router } from 'vue-router'
import { hasUnsavedChanges } from './api'
import { loadFromServer } from './reload'

// A tab can run an old build: left open for days, or started again by a phone from its cache, which
// browsers read without asking the server when they restore a tab. Its catalogue then misses the
// cards released since, and it may call routes the server changed: on 2026-11-23, an app started on
// an old build sent cards without their rarity, and every save failed from the first second.
//
// So the app asks which build is online (version.json, written by vite.config.ts) when it starts,
// when it comes back to the foreground, and from time to time while the player moves from page to
// page. Once a newer build is online, the next page change loads it from the server instead. At
// start and back after a long absence, the page reloads at once: the player has not started
// anything yet. Nothing happens while changes are not saved: the reload would lose them.

const CHECK_INTERVAL = 10 * 60 * 1000
const LONG_ABSENCE = 60 * 60 * 1000
// How long the start waits for the session of a player, loaded at the same time
const START_WAIT = 10 * 1000
// The build a reload went for. If the tab still runs an older one afterwards (a cached page),
// reloading again would loop: it waits for a build newer than that one.
const RELOADED_FOR = 'reloadedForBuild'

let newerBuild: string | undefined
let lastCheck = -Infinity
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

// A message, a search or a login being typed would be lost: wait for the next page change then. Only
// the fields the player changed count, the settings come filled.
const changedFields = new WeakSet<EventTarget>()
const TEXT_FIELDS = ['text', 'search', 'email', 'password', 'url', 'tel', 'textarea']
const isTyping = () =>
  [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('textarea, input')].some(
    (field) => changedFields.has(field) && TEXT_FIELDS.includes(field.type) && field.value !== '',
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

const checkAtStart = async () => {
  let started = false
  const onAction = () => (started = true)
  const actions = ['pointerdown', 'keydown'] as const
  for (const action of actions) addEventListener(action, onAction, { once: true })

  await check()
  const giveUpAt = Date.now() + START_WAIT
  while (newerBuild && !started && !isTyping() && Date.now() < giveUpAt) {
    if (canReload()) {
      reloadOn(location.href)
      break
    }
    // the session is not there yet, or this build was already reloaded for
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  for (const action of actions) removeEventListener(action, onAction)
}

export const watchNewBuilds = (router: Router) => {
  document.addEventListener('input', ({ target }) => target && changedFields.add(target))
  checkAtStart()
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
