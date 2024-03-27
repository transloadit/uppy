// eslint-disable-next-line import/no-unresolved
import { sveltekit } from '@sveltejs/kit/vite'
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
})
