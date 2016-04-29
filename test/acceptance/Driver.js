var webdriver = require('selenium-webdriver')
var firefox = require('selenium-webdriver/firefox')
var By = webdriver.By
var path = require('path')
var chalk = require('chalk')

// Monitor for errors, and dump them
function collectErrors (driver) {
  return driver.executeScript('return uppyLog;')
    .then(function (uppyLog) {
      console.error([
        '[uppy-log]',
        chalk.magenta(uppyLog)
      ].join(' '))

      // return driver.executeScript('return window.JSErrorCollector_errors.pump()')
      //   .then(function (errors) {
      //     if (!errors || !errors.length) {
      //       return
      //     }
      //     errors.forEach(function (error) {
      //       console.error([
      //         '[browser-error]',
      //         chalk.magenta(error.sourceName),
      //         chalk.dim('#' + error.lineNumber),
      //         chalk.red(error.errorMessage)
      //       ].join(' '))
      //     })
      //     return
      //   })
    })
}

function setDriver () {
  var profile = new firefox.Profile()
  profile.addExtension(path.join(__dirname, 'xpi', 'firebug-2.0.16.xpi'))
  profile.addExtension(path.join(__dirname, 'xpi', 'JSErrorCollector.xpi'))
  profile.setPreference('extensions.firebug.showChromeErrors', true)

  var options = new firefox.Options().setProfile(profile)
  var driver = new firefox.Driver(options)

  // var driver = new webdriver.Builder()
  //     .forBrowser('firefox')
  //     .build()

  return driver
}

module.exports = {
  setDriver,
  collectErrors,
  By
}
