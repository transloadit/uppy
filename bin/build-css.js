var sass = require('node-sass')
var postcss = require('postcss')
var autoprefixer = require('autoprefixer')
var cssnano = require('cssnano')
var chalk = require('chalk')
var fs = require('fs')
var mkdirp = require('mkdirp')

mkdirp.sync('./dist/')

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

sass.render({file: './src/scss/uppy.scss'}, function (err, sassResult) {
  if (err) handleErr(err)
  postcss([ cssnano, autoprefixer ])
    .process(sassResult.css)
    .then(function (postCSSResult) {
      postCSSResult.warnings().forEach(function (warn) {
        console.warn(warn.toString())
      })
      fs.writeFileSync('./dist/uppy.min.css', postCSSResult.css)
      console.info(chalk.green('✓ Built Uppy CSS:'), chalk.magenta('uppy.min.css'))
    })
})
