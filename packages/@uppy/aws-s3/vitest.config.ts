import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 120_000,
    globalSetup: ['./tests/s3-client/setup.js'],
    include: ['tests/**/*.test.{js,ts}',
    ],
    exclude: ['tests/s3-client/_shared.test.js'],
  },
})
