// @ts-expect-error untyped for some reason but fine
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // @vitejs/plugin-react v5+ no longer adds react/react-dom to resolve.dedupe
  // automatically (it did in v4). Without deduping, the linked @uppy/react
  // workspace pulls in a second React copy, causing "Invalid hook call".
  // https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/CHANGELOG.md (v5.0.0)
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
