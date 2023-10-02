import { configDefaults, defineConfig } from 'vitest/config' // eslint-disable-line import/no-unresolved

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
