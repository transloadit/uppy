import { fileURLToPath } from 'node:url'

const ROOT = new URL('../../', import.meta.url)
const PACKAGES_ROOT = fileURLToPath(new URL('./packages/', ROOT))

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  envDir: fileURLToPath(ROOT),
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './sw.js',
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'sw') return 'sw.js' // force predictable filename
          return 'assets/[name].[hash].js'
        },
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^uppy\/(.+)$/,
        replacement: `${PACKAGES_ROOT}uppy/$1`,
      },
      {
        find: /^@uppy\/([^/]+)$/,
        replacement: `${PACKAGES_ROOT}@uppy/$1/src/index`,
      },
      {
        find: /^@uppy\/([^/]+)\/lib\/(.+?)(\.js)?$/,
        replacement: `${PACKAGES_ROOT}@uppy/$1/src/$2`,
      },
      //   {
      //     find: /^@uppy\/([^/]+)\/(.+)$/,
      //     replacement: PACKAGES_ROOT + "@uppy/$1/src/$2",
      //   },
    ],
  },
}

export default config
