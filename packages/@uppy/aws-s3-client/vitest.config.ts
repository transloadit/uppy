import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 120_000,
    globalSetup: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    exclude: ['tests/_shared.test.js', 'tests/aws.test.js'],
  },
})
