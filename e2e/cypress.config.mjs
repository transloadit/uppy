import { defineConfig } from 'cypress'
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter.js'
import startMockServer from './mock-server.mjs'

export default defineConfig({
  defaultCommandTimeout: 16000,

  e2e: {
    baseUrl: 'http://localhost:1234',
    specPattern: 'cypress/integration/*.spec.ts',

    setupNodeEvents (on) {
      // implement node event listeners here
      installLogsPrinter(on)

      startMockServer('localhost', 4678)
    },
  },
})
