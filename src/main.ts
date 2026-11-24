import './assets/base.css'

import { ViteSSG } from 'vite-ssg'
// import { createApp } from 'vue'
import App from './App.vue'
import { routes } from './router'
import { countPageViews } from './services/analytics'
import { trackErrors } from './services/errors'
import { startLocale } from './services/i18n'
import { watchTheme } from './services/theme'
import { watchNewBuilds } from './services/version'

// `export const createApp` is required instead of the original `createApp(App).mount('#app')`
export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  { routes },
  // function to have custom setups
  ({ app, router, isClient }) => {
    if (isClient) {
      trackErrors(app, router)
      // Waits for the texts, while the files of the page are loaded
      const texts = startLocale()
      router.beforeResolve(() => texts)
      countPageViews(router)
      watchTheme()
      watchNewBuilds(router)
    }
  },
)
/*
const app = createApp(App)

app.use(router)

app.mount('#app')
*/
