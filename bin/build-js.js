var path = require('path')
var fs = require('fs')
var chalk = require('chalk')
var mkdirp = require('mkdirp')
var babelify = require('babelify')
var tinyify = require('tinyify')
var browserify = require('browserify')
var exorcist = require('exorcist')

var distPath = './packages/uppy/dist'
var srcPath = './packages/uppy'

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

function buildUppyBundle (minify) {
  var src = path.join(srcPath, 'index.js')
  var bundleFile = minify ? 'uppy.min.js' : 'uppy.js'

  var b = browserify(src, { debug: true, standalone: 'Uppy' })
  if (minify) {
    b.plugin(tinyify)
  }
  b.transform(babelify)
  b.on('error', handleErr)

  return new Promise(function (resolve, reject) {
    b.bundle()
      .pipe(exorcist(path.join(distPath, bundleFile + '.map')))
      .pipe(fs.createWriteStream(path.join(distPath, bundleFile), 'utf8'))
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

mkdirp.sync(distPath)

Promise.all([buildUppyBundle(), buildUppyBundle(true)])
  .then(function () {
    console.info(chalk.yellow('✓ JS Bundle 🎉'))
  })
