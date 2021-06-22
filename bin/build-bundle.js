const fs = require('fs')
const chalk = require('chalk')
const mkdirp = require('mkdirp')
const babelify = require('babelify')
const tinyify = require('tinyify')
const browserify = require('browserify')
const exorcist = require('exorcist')
const glob = require('glob')
const path = require('path')
const { minify } = require('terser')

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

// eslint-disable-next-line no-shadow
function buildBundle (srcFile, bundleFile, { minify = false, standalone = '' } = {}) {
  const b = browserify(srcFile, { debug: true, standalone })
  if (minify) {
    b.plugin(tinyify)
  }
  b.transform(babelify)
  b.on('error', handleErr)

  return new Promise((resolve) => {
    b.bundle()
      .pipe(exorcist(`${bundleFile}.map`))
      .pipe(fs.createWriteStream(bundleFile), 'utf8')
      .on('error', handleErr)
      .on('finish', () => {
        if (minify) {
          console.info(chalk.green(`✓ Built Minified Bundle [${standalone}]:`), chalk.magenta(bundleFile))
        } else {
          console.info(chalk.green(`✓ Built Bundle [${standalone}]:`), chalk.magenta(bundleFile))
        }
        resolve([bundleFile, standalone])
      })
  })
}
async function minifyBundle ([bundleFile, standalone]) {
  const minifiedFilePath = bundleFile.replace(/\.js$/, '.min.js')
  const js = await fs.promises.readFile(bundleFile, 'utf-8')
  const { code, map } = await minify(js, { sourceMap: true, toplevel: true  })
  return Promise.all([
    fs.promises.writeFile(minifiedFilePath, code),
    fs.promises.writeFile(`${minifiedFilePath}.map`, map),
  ])
    .then(() => console.info(chalk.green(`✓ Built Minified Bundle [${standalone}]:`), chalk.magenta(minifiedFilePath)))
}

mkdirp.sync('./packages/uppy/dist')
mkdirp.sync('./packages/@uppy/robodog/dist')
mkdirp.sync('./packages/@uppy/locales/dist')

const methods = [
  buildBundle(
    './packages/uppy/bundle.js',
    './packages/uppy/dist/uppy.js',
    { standalone: 'Uppy' }
  ).then(minifyBundle),
  buildBundle(
    './packages/@uppy/robodog/bundle.js',
    './packages/@uppy/robodog/dist/robodog.js',
    { standalone: 'Robodog' }
  ).then(minifyBundle),
]

// Build minified versions of all the locales
const localePackagePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'src', '*.js')
glob.sync(localePackagePath).forEach((localePath) => {
  const localeName = path.basename(localePath, '.js')
  methods.push(
    buildBundle(
      `./packages/@uppy/locales/src/${localeName}.js`,
      `./packages/@uppy/locales/dist/${localeName}.min.js`,
      { minify: true }
    )
  )
})

// Add BUNDLE-README.MD
methods.push(
  fs.promises.copyFile(
    `${__dirname}/../BUNDLE-README.md`,
    `./packages/uppy/dist/README.md`
  )
)

Promise.all(methods).then(() => {
  console.info(chalk.yellow('✓ JS bundles 🎉'))
})
