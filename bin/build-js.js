var path = require('path')
var fs = require('fs')
var babelify = require('babelify')
var chalk = require('chalk')
var mkdirp = require('mkdirp')
var glob = require('glob')
var browserify = require('browserify')
// var rollupify = require('rollupify')

mkdirp.sync('./dist/')

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

function buildUppyBundle () {
  browserify('./src/index.js', { debug: true, standalone: 'Uppy' })
    .plugin('minifyify', {
      map: 'uppy.js.map',
      output: './dist/uppy.js.map'
    })
    // .transform(rollupify)
    .transform(babelify)
    .on('error', handleErr)
    .bundle()
    // .pipe(exorcist('./dist/uppy.js.map'))
    .pipe(fs.createWriteStream('./dist/uppy.min.js', 'utf8'))
    .on('error', handleErr)
    .on('finish', function () {
      console.info(chalk.green('✓ Built Uppy bundle:'), chalk.magenta('uppy.min.js'))
    })
}

function buildUppyLocales () {
  mkdirp.sync('./dist/locales')
  glob('./src/locales/*.js', function (err, files) {
    if (err) console.log(err)
    files.forEach(function (file) {
      var fileName = path.basename(file, '.js')
      browserify(file, { debug: true })
        .plugin('minifyify', {
          map: fileName + '.min.js.map',
          output: './dist/locales/' + fileName + '.min.js.map'
        })
        // .transform(rollupify)
        .transform(babelify)
        .on('error', handleErr)
        .bundle()
        .pipe(fs.createWriteStream('./dist/locales/' + fileName + '.min.js', 'utf8'))
        .on('error', handleErr)
        .on('finish', function () {
          console.info(chalk.green('✓ Built Uppy locale:'), chalk.magenta(fileName + '.min.js'))
        })
    })
  })
}

buildUppyBundle()
buildUppyLocales()
