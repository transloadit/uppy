const chalk = require('chalk')
const babel = require('@babel/core')
const t = require('@babel/types')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const fs = require('fs')
const path = require('path')

const { mkdir, stat, writeFile } = fs.promises

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
          const { value } = path.node.source
          if (value.endsWith('.jsx') && value.startsWith('./')) {
            // Rewrite .jsx imports to .js:
            path.node.source.value = value.slice(0, -1) // eslint-disable-line no-param-reassign
          } else if (value === '../package.json'
                     && path.node.specifiers.length === 1
                     && path.node.specifiers[0].type === 'ImportDefaultSpecifier') {
            // Vendor-in version number:
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
