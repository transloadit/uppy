import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { transformAsync } from '@babel/core'
import autoprefixer from 'autoprefixer'
import postcssLogical from 'postcss-logical'
import postcssDirPseudoClass from 'postcss-dir-pseudo-class'

const ROOT = new URL('../../', import.meta.url)
const PACKAGES_ROOT = fileURLToPath(new URL('./packages/', ROOT))

// To enable the plugin, it looks like we need to interact with the resolution
// algorithm, but we need to stop afterwards otherwise it messes up somewhere
// else. This hack can be removed when we get rid of JSX inside of .js files.
let counter = 0

const moduleTypeCache = new Map()
function isTypeModule (file) {
  const packageFolder = file.slice(0, file.indexOf('/src/') + 1)

  const cachedValue = moduleTypeCache.get(packageFolder)
  if (cachedValue != null) return cachedValue

  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { type } = createRequire(packageFolder)('./package.json')
  const typeModule = type === 'module'
  moduleTypeCache.set(packageFolder, typeModule)
  return typeModule
}

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  envDir: fileURLToPath(ROOT),
  build: {
    commonjsOptions: {
      defaultIsModuleExports: true,
    },
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer,
        postcssLogical(),
        postcssDirPseudoClass(),
      ],
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
        if (id.startsWith(PACKAGES_ROOT) && id.endsWith('.js') && !isTypeModule(id)) {
          return id
        }
        // TODO: remove this hack when we get rid of JSX inside .js files.
        if (counter++ < 2) {
          return id
        }
      },
      transform (code, id) {
        if (id.startsWith(PACKAGES_ROOT) && id.endsWith('.js') && !isTypeModule(id)) {
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
