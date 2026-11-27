import adapter from '@sveltejs/adapter-auto'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [msw(), tailwindcss(), sveltekit({ adapter: adapter() })],
  // Kit's server code imports cookie@2, but the monorepo hoists Companion's
  // cookie@0.7 to the root, which is what the built output would resolve.
  ssr: { noExternal: ['cookie'] },
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
