var webdriver = require('selenium-webdriver')
var firefox = require('selenium-webdriver/firefox')
var By = webdriver.By
var path = require('path')
var chalk = require('chalk')

// Monitor for errors, and dump them
function monitorErrors (driver) {
  var promise = driver.executeScript('return window.JSErrorCollector_errors.pump()')
  promise.then(function (errors) {
    if (!errors || !errors.length) {
      return
    }
    errors.forEach(function (error) {
      console.error([
        '[browser-error]',
        chalk.magenta(error.sourceName),
        chalk.dim('#' + error.lineNumber),
        chalk.red(error.errorMessage)
      ].join(' '))
    })
  })
}

var profile = new firefox.Profile()
profile.addExtension(path.join(__dirname, 'xpi', 'firebug-2.0.16.xpi'))
profile.addExtension(path.join(__dirname, 'xpi', 'JSErrorCollector.xpi'))
profile.setPreference('extensions.firebug.showChromeErrors', true)

var options = new firefox.Options().setProfile(profile)
var driver = new firefox.Driver(options)

monitorErrors(driver)

var consoleElement = driver.findElement(By.id('console-log'))
var hexoServer = 'http://localhost:4000'

module.exports = {
  driver,
  consoleElement,
  By,
  hexoServer
}
