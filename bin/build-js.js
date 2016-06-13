var path = require('path')
var fs = require('fs')
var babelify = require('babelify')
var chalk = require('chalk')
var mkdirp = require('mkdirp')
var glob = require('glob')
var browserify = require('browserify')
var exec = require('child_process').exec
var exorcist = require('exorcist')

var distPath = './dist'
var srcPath = './src'

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

function buildUppyBundle (minify) {
  var src = path.join(srcPath, 'index.js')
  var bundleFile = minify ? 'uppy.min.js' : 'uppy.js'

  var b = browserify(src, { debug: true, standalone: 'Uppy' })
  if (minify) {
    b.plugin('minifyify', {
      map: bundleFile + '.map',
      output: path.join(distPath, bundleFile + '.map')
    })
  }
  b.transform(babelify)
  b.on('error', handleErr)

  return new Promise(function (resolve, reject) {
    if (minify) {
      b.bundle()
      .pipe(fs.createWriteStream(path.join(distPath, bundleFile), 'utf8'))
      .on('error', handleErr)
      .on('finish', function () {
        console.info(chalk.green('✓ Built Minified Bundle:'), chalk.magenta(bundleFile))
        resolve()
      })
    } else {
      b.bundle()
      .pipe(exorcist(path.join(distPath, 'uppy.js.map')))
      .pipe(fs.createWriteStream(path.join(distPath, bundleFile), 'utf8'))
      .on('error', handleErr)
      .on('finish', function () {
        console.info(chalk.green('✓ Built Bundle:'), chalk.magenta(bundleFile))
        resolve()
      })
    }
  })
}

// function buildUppyLocales () {
//   mkdirp.sync('./dist/locales')
//   glob('./src/locales/*.js', function (err, files) {
//     if (err) console.log(err)
//     files.forEach(function (file) {
//       var fileName = path.basename(file, '.js')
//       browserify(file, { debug: true })
//         .plugin('minifyify', {
//           map: fileName + '.min.js.map',
//           output: './dist/locales/' + fileName + '.min.js.map'
//         })
//         // .transform(rollupify)
//         .transform(babelify)
//         .on('error', handleErr)
//         .bundle()
//         .pipe(fs.createWriteStream('./dist/locales/' + fileName + '.min.js', 'utf8'))
//         .on('error', handleErr)
//         .on('finish', function () {
//           console.info(chalk.green('✓ Built Locale:'), chalk.magenta(fileName + '.min.js'))
//         })
//     })
//   })
// }

mkdirp.sync(distPath)

Promise.all([buildUppyBundle(), buildUppyBundle(true)])
  .then(function () {
    console.info(chalk.yellow('✓ JS Bundle 🎉'))
  })
