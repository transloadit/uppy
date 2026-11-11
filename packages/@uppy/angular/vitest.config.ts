import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The components use Angular's (legacy, TypeScript-style) decorators, which Vite leaves
  // untouched by default. ng-packagr compiles them itself for the published build.
  oxc: { decorator: { legacy: true } },
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
