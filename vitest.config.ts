import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      '**/angular/**',
      'packages/@uppy/companion/*',
    ],
    setupFiles: ['./private/test/globalSetup.mjs'],
  },
})
