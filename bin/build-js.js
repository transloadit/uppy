var path = require('path')
var fs = require('fs')
var chalk = require('chalk')
var mkdirp = require('mkdirp')
var babelify = require('babelify')
var tinyify = require('tinyify')
var browserify = require('browserify')
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

// function copyLocales () {
//   var copyCommand = 'cp -R ' + path.join(srcPath, 'locales/') + ' ' + path.join(distPath, 'locales/')
//   return new Promise(function (resolve, reject) {
//     exec(copyCommand, function (error, stdout, stderr) {
//       if (error) {
//         handleErr(error)
//         reject(error)
//         return
//       }
//       console.info(chalk.green('✓ Copied locales to dist'))
//       resolve()
//     })
//   })
// }

// function buildLocale (file) {
//   return new Promise(function (resolve, reject) {
//     var fileName = path.basename(file, '.js')
//     browserify(file)
//       .transform(babelify)
//       .on('error', handleErr)
//       .bundle()
//       .pipe(fs.createWriteStream('./dist/locales/' + fileName + '.js', 'utf8'))
//       .on('error', handleErr)
//       .on('finish', function () {
//         console.info(chalk.green('✓ Built Locale:'), chalk.magenta(fileName + '.js'))
//         resolve()
//       })
//   })
// }

// function buildUppyLocales () {
//   mkdirp.sync('./dist/locales')
//   var localePromises = []
//   glob('./src/locales/*.js', function (err, files) {
//     if (err) console.log(err)
//     files.forEach(function (file) {
//       localePromises.push(buildLocale(file))
//     })
//   })
//   return Promise.all(localePromises)
// }

mkdirp.sync(distPath)

Promise.all([buildUppyBundle(), buildUppyBundle(true)])
  .then(function () {
    console.info(chalk.yellow('✓ JS Bundle 🎉'))
  })

// Promise.all([buildUppyBundle(), buildUppyBundle(true), buildUppyLocales()])
//   .then(function () {
//     console.info(chalk.yellow('✓ JS Bundle 🎉'))
//   })
