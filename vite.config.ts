import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
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
