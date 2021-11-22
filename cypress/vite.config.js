const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  root: './app',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'app/index.html'),
        dashboard: resolve(__dirname, 'app/dashboard/index.html'),
      },
    },
  },
})
