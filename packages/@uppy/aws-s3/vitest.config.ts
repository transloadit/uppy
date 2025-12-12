import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 120_000,
    globalSetup: ['./tests/s3-client/setup.js'],
    setupFiles: ['./test-setup.mjs'],
    projects: [
      {
        test: {
          name: 's3-client-browser',
          include: ['tests/**/*.test.{js,ts}'],          exclude: ['tests/s3-client/_shared.test.js'],
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
