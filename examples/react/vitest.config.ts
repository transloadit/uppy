import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // vite 8 (rolldown) no longer auto-dedupes React across the linked
  // @uppy/react workspace, causing "Invalid hook call" / two React copies.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
