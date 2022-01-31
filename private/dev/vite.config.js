import { fileURLToPath } from 'node:url'
import { transformAsync } from '@babel/core'

const ROOT = new URL('../../', import.meta.url)
const PACKAGES_ROOT = fileURLToPath(new URL('./packages/', ROOT))

// To enable the plugin, it looks like we need to interact with the resolution
// algorithm, but we need to stop afterwards otherwise it messes up somewhere
// else. This hack can be removed when we get rid of JSX inside of .js files.
let counter = 0

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  envDir: ROOT.toString(),
  build: {
    commonjsOptions: {
      defaultIsModuleExports: true,
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
  resolve: {
    alias: [
      {
        find: /^uppy\/(.+)$/,
        replacement: `${PACKAGES_ROOT}uppy/$1`,
      },
      {
        find: /^@uppy\/([^/]+)$/,
        replacement: `${PACKAGES_ROOT}@uppy/$1/src/index.js`,
      },
      {
        find: /^@uppy\/([^/]+)\/lib\/(.+)$/,
        replacement: `${PACKAGES_ROOT}@uppy/$1/src/$2`,
      },
      //   {
      //     find: /^@uppy\/([^/]+)\/(.+)$/,
      //     replacement: PACKAGES_ROOT + "@uppy/$1/src/$2",
      //   },
    ],
  },
  plugins: [
    // TODO: remove plugin when we switch to ESM and get rid of JSX inside .js files.
    {
      name: 'vite-plugin-jsx-commonjs',
      // TODO: remove this hack when we get rid of JSX inside .js files.
      enforce: 'pre',
      // eslint-disable-next-line consistent-return
      resolveId (id) {
        if (id.startsWith(PACKAGES_ROOT) && id.endsWith('.js')) {
          return id
        }
        // TODO: remove this hack when we get rid of JSX inside .js files.
        if (counter++ < 2) {
          return id
        }
      },
      transform (code, id) {
        if (id.startsWith(PACKAGES_ROOT) && id.endsWith('.js')) {
          return transformAsync(code, {
            plugins: [
              ['@babel/plugin-transform-react-jsx', { pragma: 'h' }],
              'transform-commonjs',
            ],
          })
        }
        return code
      },
    },
  ],
}

export default config
