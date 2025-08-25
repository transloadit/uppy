import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          globalSetup: './vitest.setup.ts',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
