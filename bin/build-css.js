var sass = require('node-sass')
var postcss = require('postcss')
var autoprefixer = require('autoprefixer')
var cssnano = require('cssnano')
var chalk = require('chalk')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

mkdirp.sync('./dist/')

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

function minifyCSS () {
  return new Promise(function (resolve) {
    fs.readFile('./dist/uppy.css', function (err, css) {
      if (err) handleErr(err)
      postcss([ cssnano ])
        .process(css, { from: path.join(__dirname, '../dist/uppy.css') })
        .then(function (postCSSResult) {
          postCSSResult.warnings().forEach(function (warn) {
            console.warn(warn.toString())
          })
          fs.writeFile('./dist/uppy.min.css', postCSSResult.css, function (err) {
            if (err) handleErr(err)
            console.info(chalk.green('✓ Minified Bundle CSS:'), chalk.magenta('uppy.min.css'))
            resolve()
          })
        })
        .catch(err => handleErr(err))
    })
  })
}

function compileCSS () {
  return new Promise(function (resolve) {
    sass.render({file: './src/scss/uppy.scss'}, function (err, sassResult) {
      if (err) handleErr(err)
      postcss([ autoprefixer ])
        .process(sassResult.css, { from: path.join(__dirname, '../src/scss/uppy.scss') })
        .then(function (postCSSResult) {
          postCSSResult.warnings().forEach(function (warn) {
            console.warn(warn.toString())
          })
          fs.writeFile('./dist/uppy.css', postCSSResult.css, function (err) {
            if (err) handleErr(err)
            console.info(chalk.green('✓ Built Uppy CSS:'), chalk.magenta('uppy.css'))
            resolve()
          })
        })
        .catch(err => handleErr(err))
    })
  })
}

compileCSS()
  .then(minifyCSS)
  .then(function () {
    console.info(chalk.yellow('✓ CSS Bundle 🎉'))
  })
  .catch(err => handleErr(err))
