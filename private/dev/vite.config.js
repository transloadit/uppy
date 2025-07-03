import { fileURLToPath } from 'node:url'
import autoprefixer from 'autoprefixer'
import postcssDirPseudoClass from 'postcss-dir-pseudo-class'
import postcssLogical from 'postcss-logical'

const ROOT = new URL('../../', import.meta.url)
const PACKAGES_ROOT = fileURLToPath(new URL('./packages/', ROOT))

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  envDir: fileURLToPath(ROOT),
  css: {
    postcss: {
      plugins: [autoprefixer, postcssLogical(), postcssDirPseudoClass()],
    },
  },
  esbuild: {
    jsx: 'automatic',
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
