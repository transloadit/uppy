import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const ROOT = new URL('../../', import.meta.url)

// https://vitejs.dev/config/
export default defineConfig({
  envDir: fileURLToPath(ROOT),
  plugins: [vue(), tailwindcss()],
})
