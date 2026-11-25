import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import vue from '@astrojs/vue'
import type { AstroIntegration } from 'astro'
import { defineConfig } from 'astro/config'

import { cardNames, errorsSdkOnlyWithDsn } from './build/plugins'

// The time of the build names it. The app knows its own (__BUILD_ID__), and version.json
// (src/pages/version.json.ts) tells which build is online: a tab left open for weeks compares the two
// (src/services/version.ts). An ISO date, so that a later build compares greater.
const BUILD_ID = new Date().toISOString()

// Astro empties dist/ before a build. Before it, dist/ was the checkout of the gh-pages branch, which
// scripts/deploy.sh moves to gh-pages/.
const keepOldCheckout = (): AstroIntegration => ({
  name: 'keep-old-checkout',
  hooks: {
    'astro:config:setup': ({ command, config }) => {
      if (command === 'build' && existsSync(new URL('.git', config.outDir))) {
        throw new Error('dist/ is the checkout of gh-pages. Move it first: mv dist gh-pages')
      }
    },
  },
})

// https://docs.astro.build/reference/configuration-reference/
export default defineConfig({
  site: 'https://pokemon-tcg.exchange',
  // /help is help.html, /fr is fr/index.html: the addresses GitHub Pages serves
  build: { format: 'preserve', assets: 'assets' },
  server: { port: 5173 },
  devToolbar: { enabled: false },
  // For the app, and for its icons in the public pages
  integrations: [vue({ devtools: true }), keepOldCheckout()],
  vite: {
    // VITE_API_URL points the front at another server (src/services/api.ts)
    envPrefix: ['PUBLIC_', 'VITE_'],
    plugins: [errorsSdkOnlyWithDsn(), cardNames()],
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
    environments: {
      // What the browsers download
      client: {
        build: {
          // Source maps are sent to Bugsink when deploying (scripts/deploy.sh), never published
          sourcemap: 'hidden',
          rolldownOptions: {
            output: {
              // errors-sdk keeps its name from one deploy to the next: a tab opened before a deploy
              // can still load it to report an error, when the hashed files of the old build are gone
              chunkFileNames: (chunk) =>
                chunk.name === 'errors-sdk' ? 'assets/errors-sdk.js' : 'assets/[name].[hash].js',
            },
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
})
