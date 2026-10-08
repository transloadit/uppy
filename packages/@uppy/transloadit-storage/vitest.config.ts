import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [msw()],
  test: {
    projects: [
      { test: { name: 'unit', include: ['test/**/*.test.ts'] } },
      {
        test: {
          name: 'browser',
          include: ['test/**/*.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
