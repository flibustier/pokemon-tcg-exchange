import './assets/base.css'
import './assets/header.css'

import { createApp } from 'vue'

import App from './App.vue'
import { createAppRouter } from './router'
import { countPageViews } from './services/analytics'
import { trackErrors } from './services/errors'
import { watchTitle } from './services/head'
import { startLocale } from './services/i18n'
import { watchTheme } from './services/theme'
import { watchNewBuilds } from './services/version'

const app = createApp(App)
const router = createAppRouter()

trackErrors(app, router)
// Waits for the texts, while the files of the page are loaded
const texts = startLocale()
router.beforeResolve(() => texts)
countPageViews(router)
watchTheme()
watchTitle(router)
watchNewBuilds(router)

app.use(router)
// Until then, the page shows what Astro wrote (AppLayout.astro)
router.isReady().then(() => app.mount('#app'))
