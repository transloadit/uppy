var test = require('tape')
var path = require('path')
var chalk = require('chalk')
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

    // driver.manage().timeouts().implicitlyWait(5 * 1000)

    // If this is Edge or Safari, fake upload a dummy file object
    var platformBrowser = platform.browser.toLowerCase()
    if (platformBrowser === 'safari' || platformBrowser === 'microsoftedge') {
      console.log('fake-selecting a fake file')
      // driver.executeScript(Driver.UppySelectFakeFile)
      driver.executeScript(Driver.UppySelectFakeFile).then(function (result) {
        console.log(result)
        driver.findElement({css: '.UppyForm-uploadBtn'}).click()
      })
    } else {
      // Find input by css selector & pass absolute image path to it
      console.log('selecting a real file')
      driver.findElement({css: '.UppyFormContainer .UppyForm-input'}).then(function (el) {
        el.sendKeys(path.join(__dirname, 'image.jpg'))
        el.sendKeys(path.join(__dirname, 'image2.jpg'))
        driver.findElement({css: '.UppyForm-uploadBtn'}).click()
      })
    }

    function isUploaded () {
      // .getText() only works on visible elements, so we use .getAttribute('textContent'), go figure
      // http://stackoverflow.com/questions/21994261/gettext-not-working-on-a-select-from-dropdown
      return driver.findElement({css: '.UppyProgressBar .UppyProgressBar-percentage'})
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
