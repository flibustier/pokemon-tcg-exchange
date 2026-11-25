import { watch } from 'vue'
import type { Router } from 'vue-router'

import { locale, t } from './i18n'

// The title of the tab, in the language of the player. What search engines and link previews read is
// in the HTML (src/pages).
export const watchTitle = (router: Router) =>
  watch(
    [router.currentRoute, locale],
    ([{ meta, matched }]) => {
      // Not before the first page is known
      if (matched.length > 0) document.title = t(meta.title ?? 'title.app')
    },
    { immediate: true },
  )
