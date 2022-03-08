import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { transformAsync } from '@babel/core'
import t from '@babel/types'
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
const packageLibImport = /^@uppy\/([^/])\/lib\/(.+)$/
const packageEntryImport = /^@uppy\/([^/])$/
function isSpecifierTypeModule (specifier) {
  const packageLib = packageLibImport.exec(specifier)
  if (packageLib != null) {
    return isTypeModule(`${PACKAGES_ROOT}@uppy/${packageLib[1]}/src/${packageLib[2]}`)
  }
  const packageEntry = packageEntryImport.exec(specifier)
  if (packageEntry != null) {
    return isTypeModule(`${PACKAGES_ROOT}@uppy/${packageEntry[1]}/src/index.js`)
  }
  return false
}

const JS_FILE_EXTENSION = /\.jsx?$/

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
        if (id.startsWith(PACKAGES_ROOT) && JS_FILE_EXTENSION.test(id)) {
          return id
        }
        // TODO: remove this hack when we get rid of JSX inside .js files.
        if (counter++ < 2) {
          return id
        }
      },
      transform (code, id) {
        if (id.startsWith(PACKAGES_ROOT) && JS_FILE_EXTENSION.test(id)) {
          return transformAsync(code, isTypeModule(id) ? {
            plugins: [
              id.endsWith('.jsx') ? ['@babel/plugin-transform-react-jsx', { pragma: 'h' }] : {},
              {
                // On type: "module" packages, we still want to rewrite import
                // statements that tries to access a named export from a CJS
                // module to using only the default import.
                visitor: {
                  ImportDeclaration (path) {
                    const { specifiers, source: { value } } = path.node
                    if (value.startsWith('@uppy/') && !isSpecifierTypeModule(value)
                      && specifiers.some(node => node.type !== 'ImportDefaultSpecifier')) {
                      const oldSpecifiers = specifiers[0].type === 'ImportDefaultSpecifier'
                        // If there's a default import, it must come first.
                        ? specifiers.splice(1)
                        // If there's no default import, we create one from a random identifier.
                        : specifiers.splice(0, specifiers.length, t.importDefaultSpecifier(t.identifier(`_import_${counter++}`)))
                      if (oldSpecifiers[0]?.type === 'ImportNamespaceSpecifier') {
                        // import defaultVal, * as namespaceImport from '@uppy/package'
                        // is transformed into:
                        // import defaultVal from '@uppy/package'; const namespaceImport = defaultVal
                        path.insertAfter(
                          t.variableDeclaration('const', [t.variableDeclarator(
                            oldSpecifiers[0].local,
                            specifiers[0].local,
                          )]),
                        )
                      } else if (oldSpecifiers.length !== 0) {
                        // import defaultVal, { exportedVal as importedName, other } from '@uppy/package'
                        // is transformed into:
                        // import defaultVal from '@uppy/package'; const { exportedVal: importedName, other } = defaultVal
                        path.insertAfter(t.variableDeclaration('const', [t.variableDeclarator(
                          t.objectPattern(
                            oldSpecifiers.map(specifier => t.objectProperty(
                              t.identifier(specifier.imported.name),
                              specifier.local,
                            )),
                          ),
                          specifiers[0].local,
                        )]))
                      }
                    }
                  },
                },
              },
            ],
          } : {
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
