import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        // Plain unit tests (`test/*.test.ts`), no DOM needed.
        test: {
          name: 'node',
          include: ['test/**/*.test.ts'],
        },
      },
      {
        plugins: [msw()],
        test: {
          name: 'browser',
          include: ['test/**/*.browser.test.tsx'],
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
