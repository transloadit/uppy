import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [msw(), tailwindcss(), sveltekit()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
