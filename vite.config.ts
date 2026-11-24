import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import type { ViteSSGOptions } from 'vite-ssg'

import config from './config.json' with { type: 'json' }

// Without a BUGSINK_DSN in config.json, errors.ts never loads errors-sdk.js and nothing refers to it
// anymore, but Rolldown still writes it: leave it out.
const errorsSdkOnlyWithDsn = (): Plugin => ({
  name: 'errors-sdk-only-with-dsn',
  apply: 'build',
  generateBundle(_options, bundle) {
    if (!config.BUGSINK_DSN) {
      delete bundle['assets/errors-sdk.js']
      delete bundle['assets/errors-sdk.js.map']
    }
  },
})

// The time of the build names it. The app knows its own (__BUILD_ID__), and version.json tells
// which build is online: a tab left open for weeks compares the two (src/services/version.ts).
// An ISO date, so that a later build compares greater.
const BUILD_ID = new Date().toISOString()

const publishBuildId = (): Plugin => ({
  name: 'publish-build-id',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ build: BUILD_ID }),
    })
  },
})

// The pages of a signed-in player, and one-off links. Nobody is signed in at build time, so their
// HTML held the sign-in form, or "Page not found" for a conversation (404.html): the player saw it
// until the app was there. Their HTML is left empty instead, the app draws them in the browser.
const PRIVATE_PAGES = /^\/(account|logout|confirm-email|404)(\/|$)/

const ssgOptions: Partial<ViteSSGOptions> = {
  onPageRendered(route, html, { router }) {
    if (PRIVATE_PAGES.test(route)) {
      return html.replace(/(<div id="app"[^>]*>)[\s\S]*(<\/div>\s*<script)/, '$1$2')
    }
    // From April to November 2026, useHead came from another major version of @unhead/vue than
    // vite-ssg's, and the HTML lost the titles without a word
    const { title } = router.resolve(route).meta
    if (title && !html.includes(`<title>${title}</title>`)) {
      throw new Error(`${route}: the title is not in the HTML. Same @unhead/vue as vite-ssg?`)
    }
    return html
  },
}

// `virtual:card-names/es`: the card names that differ from the English ones, by English name. Names
// repeat from a set to another, so this is a fraction of the file of the card database, which has
// every card. A card translated another way than its namesakes is there by its id.
const CARD_NAMES = 'virtual:card-names/'

const cardNames = (): Plugin => {
  const require = createRequire(import.meta.url)
  const read = (file: string): { set: string; number: number; name: string }[] =>
    JSON.parse(readFileSync(require.resolve(`pokemon-tcg-pocket-database/dist/${file}`), 'utf8'))

  return {
    name: 'card-names',
    resolveId: (id) => (id.startsWith(CARD_NAMES) ? '\0' + id : undefined),
    load(id) {
      if (!id.startsWith('\0' + CARD_NAMES)) return
      const locale = id.slice(CARD_NAMES.length + 1)
      const translated = new Map(
        read(`cards.${locale}.no-image.min.json`).map((card) => [cardId(card), card.name]),
      )
      const names: Record<string, string> = {}
      const seen: Record<string, string> = {}
      for (const card of read('cards.no-image.min.json')) {
        const name = translated.get(cardId(card)) ?? card.name
        seen[card.name] ??= name
        if (name !== seen[card.name]) names[cardId(card)] = name
        else if (name !== card.name) names[card.name] = name
      }
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(names))})`
    },
  }
}

// As in src/services/cards.ts
const cardId = ({ set, number }: { set: string; number: number }) =>
  `${set.toUpperCase()}-${number}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), errorsSdkOnlyWithDsn(), publishBuildId(), cardNames()],
  ssgOptions,
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: {
    // Source maps are sent to Bugsink when deploying (scripts/deploy.sh), never published
    sourcemap: 'hidden',
    rolldownOptions: {
      output: {
        // errors-sdk keeps its name from one deploy to the next: a tab opened before a deploy can
        // still load it to report an error, when the hashed files of the old build are gone
        chunkFileNames: (chunk) =>
          chunk.name === 'errors-sdk' ? 'assets/errors-sdk.js' : 'assets/[name]-[hash].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
