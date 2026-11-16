import { START_LOCATION, type RouteLocationNormalizedLoaded, type Router } from 'vue-router'

declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path: string }) => void }
  }
}

// A route with a parameter is named by its pattern (/account/messages/:id), so no player id ends
// up in the statistics or in the error reports (errors.ts).
export const pagePath = (route: RouteLocationNormalizedLoaded) => {
  const record = route.matched.at(-1)
  const hasParams = Object.keys(route.params).length > 0
  return hasParams && record && route.name !== 'not-found' ? record.path : route.path
}

// GoatCounter's count.js counts the page a visitor lands on. Going to another page inside the
// app doesn't reload anything, so GoatCounter wouldn't see it: count each route change here.
// The landing page is left to count.js, and a change of #anchor only isn't a new page.
export const countPageViews = (router: Router) => {
  router.afterEach((to, from, failure) => {
    if (failure || from === START_LOCATION || to.path === from.path) return
    window.goatcounter?.count?.({ path: pagePath(to) })
  })
}
