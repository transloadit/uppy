const chalk = require('chalk')
const babel = require('@babel/core')
const t = require('@babel/types')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const fs = require('fs')
const path = require('path')

const { mkdir, stat, writeFile } = fs.promises

const PACKAGE_JSON_IMPORT = /^\..*\/package.json$/
const SOURCE = 'packages/{*,@uppy/*}/src/**/*.js?(x)'
// Files not to build (such as tests)
const IGNORE = /\.test\.js$|__mocks__|svelte|angular|companion\//
// Files that should trigger a rebuild of everything on change
const META_FILES = [
  'babel.config.js',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'bin/build-lib.js',
]

function lastModified (file, createParentDir = false) {
  return stat(file).then((s) => s.mtime, async (err) => {
    if (err.code === 'ENOENT') {
      if (createParentDir) {
        await mkdir(path.dirname(file), { recursive: true })
      }
      return 0
    }
    throw err
  })
}

const moduleTypeCache = new Map()
const versionCache = new Map()
async function isTypeModule (file) {
  const packageFolder = file.slice(0, file.indexOf('/src/'))

  const cachedValue = moduleTypeCache.get(packageFolder)
  if (cachedValue != null) return cachedValue

  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { type, version } = require(path.join(__dirname, '..', packageFolder, 'package.json'))
  const typeModule = type === 'module'
  if (process.env.FRESH) {
    // in case it hasn't been done before.
    await mkdir(path.join(packageFolder, 'lib'), { recursive: true })
  }
  if (typeModule) {
    await writeFile(path.join(packageFolder, 'lib', 'package.json'), '{"type":"commonjs"}')
  }
  moduleTypeCache.set(packageFolder, typeModule)
  versionCache.set(packageFolder, version)
  return typeModule
}

// eslint-disable-next-line no-shadow
function transformExportDeclarations (path) {
  const { value } = path.node.source
  if (value.endsWith('.jsx') && value.startsWith('./')) {
    // Rewrite .jsx imports to .js:
    path.node.source.value = value.slice(0, -1) // eslint-disable-line no-param-reassign
  }

  path.replaceWith(
    t.assignmentExpression(
      '=',
      t.memberExpression(t.identifier('module'), t.identifier('exports')),
      t.callExpression(t.identifier('require'), [path.node.source]),
    ),
  )
}

async function buildLib () {
  const metaMtimes = await Promise.all(META_FILES.map((filename) => lastModified(path.join(__dirname, '..', filename))))
  const metaMtime = Math.max(...metaMtimes)

  const files = await glob(SOURCE)
  /* eslint-disable no-continue */
  for (const file of files) {
    if (IGNORE.test(file)) {
      continue
    }
    const libFile = file.replace('/src/', '/lib/').replace(/\.jsx$/, '.js')

    // on a fresh build, rebuild everything.
    if (!process.env.FRESH) {
      const [srcMtime, libMtime] = await Promise.all([
        lastModified(file),
        lastModified(libFile, true),
      ])
      // Skip files that haven't changed
      if (srcMtime < libMtime && metaMtime < libMtime) {
        continue
      }
    }

    const plugins = await isTypeModule(file) ? [['@babel/plugin-transform-modules-commonjs', {
      importInterop: 'none',
    }], {
      visitor: {
        // eslint-disable-next-line no-shadow
        ImportDeclaration (path) {
          let { value } = path.node.source
          if (value.endsWith('.jsx') && value.startsWith('./')) {
            // Rewrite .jsx imports to .js:
            value = path.node.source.value = value.slice(0, -1) // eslint-disable-line no-param-reassign,no-multi-assign
          }
          if (PACKAGE_JSON_IMPORT.test(value)
              && path.node.specifiers.length === 1
              && path.node.specifiers[0].type === 'ImportDefaultSpecifier') {
            // Vendor-in version number from package.json files:
            const version = versionCache.get(file.slice(0, file.indexOf('/src/')))
            if (version != null) {
              const [{ local }] = path.node.specifiers
              path.replaceWith(
                t.variableDeclaration('const', [t.variableDeclarator(local,
                  t.objectExpression([
                    t.objectProperty(t.stringLiteral('version'), t.stringLiteral(version)),
                  ]))]),
              )
            }
          } else if (path.node.specifiers[0].type === 'ImportDefaultSpecifier') {
            const [{ local }, ...otherSpecifiers] = path.node.specifiers
            if (otherSpecifiers.length === 1 && otherSpecifiers[0].type === 'ImportNamespaceSpecifier') {
              // import defaultVal, * as namespaceImport from '@uppy/package'
              // is transformed into:
              // const defaultVal = require('@uppy/package'); const namespaceImport = defaultVal
              path.insertAfter(
                t.variableDeclaration('const', [
                  t.variableDeclarator(
                    otherSpecifiers[0].local,
                    local,
                  ),
                ]),
              )
            } else if (otherSpecifiers.length !== 0) {
              // import defaultVal, { exportedVal as importedName, other } from '@uppy/package'
              // is transformed into:
              // const defaultVal = require('@uppy/package'); const { exportedVal: importedName, other } = defaultVal
              path.insertAfter(t.variableDeclaration('const', [t.variableDeclarator(
                t.objectPattern(
                  otherSpecifiers.map(specifier => t.objectProperty(
                    t.identifier(specifier.imported.name),
                    specifier.local,
                  )),
                ),
                local,
              )]))
            }
            path.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  local,
                  t.callExpression(t.identifier('require'), [
                    t.stringLiteral(value),
                  ]),
                ),
              ]),
            )
          }
        },
        ExportAllDeclaration: transformExportDeclarations,
        // eslint-disable-next-line no-shadow,consistent-return
        ExportNamedDeclaration (path) {
          if (path.node.source != null) return transformExportDeclarations(path)
        },
        // eslint-disable-next-line no-shadow
        ExportDefaultDeclaration (path) {
          const moduleExports =  t.memberExpression(t.identifier('module'), t.identifier('exports'))
          if (!t.isDeclaration(path.node.declaration)) {
            path.replaceWith(
              t.assignmentExpression('=', moduleExports, path.node.declaration),
            )
          } else if (path.node.declaration.id != null) {
            const { id } = path.node.declaration
            path.insertBefore(path.node.declaration)
            path.replaceWith(
              t.assignmentExpression('=', moduleExports, id),
            )
          } else {
            const id = t.identifier('_default')
            path.node.declaration.id = id // eslint-disable-line no-param-reassign
            path.insertBefore(path.node.declaration)
            path.replaceWith(
              t.assignmentExpression('=', moduleExports, id),
            )
          }
        },
      },
    }] : undefined
    const { code, map } = await babel.transformFileAsync(file, { sourceMaps: true, plugins })
    await Promise.all([
      writeFile(libFile, code),
      writeFile(`${libFile}.map`, JSON.stringify(map)),
    ])
    console.log(chalk.green('Compiled lib:'), chalk.magenta(libFile))
  }
  /* eslint-enable no-continue */
}

console.log('Using Babel version:', require('@babel/core/package.json').version)

buildLib().catch((err) => {
  console.error(err)
  process.exit(1)
})
