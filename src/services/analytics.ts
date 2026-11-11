import { START_LOCATION, type Router } from 'vue-router'

declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path: string }) => void }
  }
}

// GoatCounter's count.js counts the page a visitor lands on. Going to another page inside the
// app doesn't reload anything, so GoatCounter wouldn't see it: count each route change here.
// The landing page is left to count.js, and a change of #anchor only isn't a new page.
// A route with a parameter is counted by its pattern (/account/messages/:id), so no player id
// ends up in the statistics.
export const countPageViews = (router: Router) => {
  router.afterEach((to, from, failure) => {
    if (failure || from === START_LOCATION || to.path === from.path) return
    const record = to.matched.at(-1)
    const hasParams = Object.keys(to.params).length > 0
    const path = hasParams && record && to.name !== 'not-found' ? record.path : to.path
    window.goatcounter?.count?.({ path })
  })
}
