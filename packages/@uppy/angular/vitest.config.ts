import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The tests compile the components at runtime (JIT), which needs Angular's
  // decorators transformed the `experimentalDecorators` way.
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
