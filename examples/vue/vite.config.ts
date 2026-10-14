import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'
import { defineConfig } from 'vite'

const ROOT = new URL('../../', import.meta.url)

// https://vitejs.dev/config/
export default defineConfig({
  envDir: fileURLToPath(ROOT),
  plugins: [msw(), vue(), tailwindcss()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
