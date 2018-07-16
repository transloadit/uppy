var path = require('path')
var chalk = require('chalk')
var glob = require('glob')
var exec = require('child_process').exec

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

function gzip (file) {
  return new Promise(function (resolve, reject) {
    var fileName = path.basename(file)
    var gzipCommand = 'gzip < ' + file + ' > ' + file + '.gz'
    exec(gzipCommand, function (error, stdout, stderr) {
      if (error) {
        handleErr(error)
        reject(error)
        return
      }
      console.info(chalk.green('✓ Gzipped: '), chalk.magenta(fileName + '.gz'))
      resolve()
    })
  })
}

function gzipDist () {
  return new Promise(function (resolve) {
    glob('./packages/uppy/dist/**/*.*(css|js)', function (err, files) {
      if (err) console.log(err)
      var gzipPromises = []
      files.forEach(function (file) {
        gzipPromises.push(gzip(file))
      })
      return Promise.all(gzipPromises).then(function () {
        console.info(chalk.yellow('✓ Gzipped everything yo 🎉'))
        resolve()
      })
    })
  })
}

gzipDist()
