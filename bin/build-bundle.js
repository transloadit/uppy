var fs = require('fs')
var chalk = require('chalk')
var mkdirp = require('mkdirp')
var babelify = require('babelify')
var tinyify = require('tinyify')
var browserify = require('browserify')
var exorcist = require('exorcist')
var glob = require('glob')
var path = require('path')

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

function buildBundle (srcFile, bundleFile, { minify = false, standalone = '' } = {}) {
  var b = browserify(srcFile, { debug: true, standalone })
  if (minify) {
    b.plugin(tinyify)
  }
  b.transform(babelify)
  b.on('error', handleErr)

  return new Promise(function (resolve, reject) {
    b.bundle()
      .pipe(exorcist(bundleFile + '.map'))
      .pipe(fs.createWriteStream(bundleFile), 'utf8')
      .on('error', handleErr)
      .on('finish', function () {
        if (minify) {
          console.info(chalk.green(`✓ Built Minified Bundle [${standalone}]:`), chalk.magenta(bundleFile))
        } else {
          console.info(chalk.green(`✓ Built Bundle [${standalone}]:`), chalk.magenta(bundleFile))
        }
        resolve()
      })
  })
}

mkdirp.sync('./packages/uppy/dist')
mkdirp.sync('./packages/@uppy/robodog/dist')
mkdirp.sync('./packages/@uppy/locales/dist')

const methods = [
  buildBundle(
    './packages/uppy/bundle.js',
    './packages/uppy/dist/uppy.js',
    { standalone: 'Uppy' }
  ),
  buildBundle(
    './packages/uppy/bundle.js',
    './packages/uppy/dist/uppy.min.js',
    { standalone: 'Uppy', minify: true }
  ),
  buildBundle(
    './packages/@uppy/robodog/bundle.js',
    './packages/@uppy/robodog/dist/robodog.js',
    { standalone: 'Robodog' }
  ),
  buildBundle(
    './packages/@uppy/robodog/bundle.js',
    './packages/@uppy/robodog/dist/robodog.min.js',
    { standalone: 'Robodog', minify: true }
  )
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

Promise.all(methods).then(function () {
  console.info(chalk.yellow('✓ JS bundles 🎉'))
})
