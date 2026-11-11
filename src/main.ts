import './assets/base.css'

import { ViteSSG } from 'vite-ssg'
// import { createApp } from 'vue'
import App from './App.vue'
import { routes } from './router'
import { countPageViews } from './services/analytics'

// `export const createApp` is required instead of the original `createApp(App).mount('#app')`
export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  { routes },
  // function to have custom setups
  ({ router, isClient }) => {
    if (isClient) countPageViews(router)
  },
)
/*
const app = createApp(App)

app.use(router)

app.mount('#app')
*/
