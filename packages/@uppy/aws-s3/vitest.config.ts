import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 120_000,
    globalSetup: ['tests/s3-client/setup.ts'],
    projects: [
      {
        test: {
          name: 's3-jsdom',
          include: ['**/*.test.ts'],
          environment: 'jsdom',
        },
      },
      {
        test: {
          name: 's3-browser',
          include: ['**/minio.test.ts'],
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
