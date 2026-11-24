import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

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

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), errorsSdkOnlyWithDsn(), publishBuildId()],
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
