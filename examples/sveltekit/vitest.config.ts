import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    include: [
      '@transloadit/prettier-bytes',
      'classnames',
      'cropperjs',
      'dequal/lite',
      'exifr/dist/mini.esm.mjs',
      'is-mobile',
      'lodash/debounce.js',
      'lodash/throttle.js',
      'mime-match',
      'namespace-emitter',
      'nanoid/non-secure',
      'p-queue',
      'p-retry',
      'preact',
      'preact/hooks',
      'preact/jsx-runtime',
      'pretty-bytes',
      'shallow-equal',
      'tus-js-client',
    ],
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
