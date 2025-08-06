import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const ROOT = new URL('../../', import.meta.url)

// https://vitejs.dev/config/
export default defineConfig({
  envDir: fileURLToPath(ROOT),
  plugins: [vue(), tailwindcss()],
})
