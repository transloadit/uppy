var fs = require('fs')
var chalk = require('chalk')
var mkdirp = require('mkdirp')
var babelify = require('babelify')
var tinyify = require('tinyify')
var browserify = require('browserify')
var exorcist = require('exorcist')

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

function buildBundle (srcFile, bundleFile, { minify = false } = {}) {
  var b = browserify(srcFile, { debug: true, standalone: 'Uppy' })
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
          console.info(chalk.green('✓ Built Minified Bundle:'), chalk.magenta(bundleFile))
        } else {
          console.info(chalk.green('✓ Built Bundle:'), chalk.magenta(bundleFile))
        }
        resolve()
      })
  })
}

mkdirp.sync('./packages/uppy/dist')
mkdirp.sync('./packages/@uppy/robodog/dist')

Promise.all([
  buildBundle(
    './packages/uppy/bundle.js',
    './packages/uppy/dist/uppy.js'
  ),
  buildBundle(
    './packages/uppy/bundle.js',
    './packages/uppy/dist/uppy.min.js',
    { minify: true }
  ),
  buildBundle(
    './packages/@uppy/robodog/bundle.js',
    './packages/@uppy/robodog/dist/robodog.js'
  ),
  buildBundle(
    './packages/@uppy/robodog/bundle.js',
    './packages/@uppy/robodog/dist/robodog.min.js',
    { minify: true }
  )
]).then(function () {
  console.info(chalk.yellow('✓ JS Bundle 🎉'))
})
