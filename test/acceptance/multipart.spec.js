var test = require('tape')
var path = require('path')
var webdriver = require('selenium-webdriver')
var chalk = require('chalk')
var By = webdriver.By
var Driver = require('./Driver')
var collectErrors = Driver.collectErrors

module.exports = function (driver, platform, host) {
  test('multipart: upload two files ' +
      chalk.underline.yellow('[' +
        platform.os + ' ' +
        platform.browser + ' ' +
        platform.version +
      ']'),
  function (t) {
    t.plan(1)

    // Go to the example URL
    driver.get(host + '/examples/multipart/')

    // Find input by css selector & pass absolute image path to it
    driver.findElement(By.css('.UppyForm .UppyForm-input')).then(function (el) {
      el.sendKeys(path.join(__dirname, 'image.jpg'))
      el.sendKeys(path.join(__dirname, 'image2.jpg'))
      driver.findElement(By.css('.UppyForm-uploadBtn')).click()
    })

    function isUploaded () {
      // .getText() only work on visible elements, so we use .getAttribute('textContent'), go figure
      // http://stackoverflow.com/questions/21994261/gettext-not-working-on-a-select-from-dropdown
      return driver.findElement(By.css('.UppyProgressBar .UppyProgressBar-percentage'))
        .getAttribute('textContent')
        .then(function (value) {
          var progress = parseInt(value)
          var isFileUploaded = progress === 100
          return isFileUploaded
        })
    }

    driver.wait(isUploaded, 15000, 'File image.jpg should be uploaded within 15 seconds')
      .then(function (result) {
        collectErrors(driver).then(function () {
          t.equal(result, true)
          driver.quit()
        })
      })
      .catch(function (err) {
        collectErrors(driver).then(function () {
          t.fail(err)
          driver.quit()
        })
      })
  })
}
