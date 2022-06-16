import { fileURLToPath } from 'node:url'
import { transformAsync } from '@babel/core'
import t from '@babel/types'
import autoprefixer from 'autoprefixer'
import postcssLogical from 'postcss-logical'
import postcssDirPseudoClass from 'postcss-dir-pseudo-class'

const ROOT = new URL('../../', import.meta.url)
const PACKAGES_ROOT = fileURLToPath(new URL('./packages/', ROOT))

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  envDir: fileURLToPath(ROOT),
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
    // TODO: remove plugin when we remove the socket.io require call in @uppy/transloadit/src/Assembly.
    {
      name: 'vite-plugin-rewrite-dynamic-socketIo-require',
      // eslint-disable-next-line consistent-return
      resolveId (id) {
        if (id.startsWith(PACKAGES_ROOT) && id.endsWith('transloadit/src/Assembly.js')) {
          return id
        }
      },
      transform (code, id) {
        if (id.startsWith(PACKAGES_ROOT) && id.endsWith('transloadit/src/Assembly.js')) {
          return transformAsync(code, {
            plugins: [
              {
                visitor: {
                  FunctionDeclaration (path) {
                    if (path.node.id.name === 'requireSocketIo') {
                      const prevSibling = path.getPrevSibling()
                      if (t.isImportDeclaration(prevSibling) && prevSibling.node.specifiers?.length === 1
                         && t.isImportDefaultSpecifier(prevSibling.node.specifiers[0])
                         && prevSibling.node.specifiers[0].local.name === 'socketIo') {
                        // The require call has already been rewritten to an import statement.
                        return
                      }
                      if (!t.isVariableDeclaration(prevSibling)) {
                        const { type, loc } = prevSibling.node
                        throw new Error(`Unexpected ${type} at line ${loc.start.line}, cannot apply requireSocketIo hack`)
                      }

                      const { id:socketIoIdentifier } = prevSibling.node.declarations[0]

                      prevSibling.replaceWith(t.importDeclaration(
                        [t.importDefaultSpecifier(socketIoIdentifier)],
                        t.stringLiteral('socket.io-client'),
                      ))
                      path.replaceWith(t.functionDeclaration(path.node.id, path.node.params, t.blockStatement([
                        t.returnStatement(socketIoIdentifier),
                      ])))
                    }
                  },
                },
              },
            ],
          })
        }
        return code
      },
    },
  ],
}

export default config
