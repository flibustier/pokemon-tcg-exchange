import type { RouteLocationNormalizedLoaded } from 'vue-router'

const SITE = 'https://pokemon-tcg.exchange'
const DEFAULT_TITLE = 'Pokemon TCG Pocket Exchange Center - Trade Your Cards with the World'

// The head of each page, from the meta of its route (router/index.ts). It is written in the HTML at
// build time, for the search engines and link previews that run no JavaScript: vite.config.ts fails
// the build when it is missing. A page without a title and a description of its own is not for
// search engines.
export const pageHead = ({ path, meta }: RouteLocationNormalizedLoaded) => {
  const { title, description } = meta
  if (!title || !description) {
    return { title: DEFAULT_TITLE, meta: [{ name: 'robots', content: 'noindex' }] }
  }

  const url = SITE + path
  return {
    title,
    link: [{ rel: 'canonical', href: url }],
    meta: [
      { name: 'description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'twitter:url', content: url },
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
    ],
  }
}
