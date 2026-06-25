import { defineConfig } from 'vitest/config'

// In the browser (where Uppy runs) tus-js-client uses its browser build, which
// accepts `Blob`/`File` and `XMLHttpRequest`. Under the default Node resolution
// Vitest would load the Node build, which only accepts `Buffer`/`Readable`.
// Alias to the browser build so jsdom tests exercise the same code path as
// production.
export default defineConfig({
  resolve: {
    alias: {
      'tus-js-client': 'tus-js-client/lib.esm/browser/index.js',
    },
  },
  test: {
    environment: 'jsdom',
    // Run with the document origin set to the upload endpoint so requests in
    // tests are same-origin. Otherwise jsdom treats them as cross-origin and
    // hides the response status (`xhr.status === 0`).
    environmentOptions: {
      jsdom: {
        url: 'https://fake-endpoint.uppy.io',
      },
    },
  },
})
