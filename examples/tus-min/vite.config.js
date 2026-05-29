import { defineConfig } from 'vite'

// Fixed port so the server's CORS allow-list (http://localhost:5173) matches.
export default defineConfig({
  server: { port: 5173, strictPort: true },
})
