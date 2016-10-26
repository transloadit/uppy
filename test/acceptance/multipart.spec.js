var test = require('tape')
var tools = require('./tools')
var path = require('path')

module.exports = function (driver, platform, host) {
  var testName = 'Multipart: upload a file'

  test(tools.prettyTestName(testName, platform), function (t) {
    t.plan(1)

    driver.get(host + '/examples/multipart/')
    driver.manage().window().maximize()

    tools.setSauceTestName(driver, testName)

    // driver.manage().timeouts().implicitlyWait(5 * 1000)

    var platformBrowser = platform.browser.toLowerCase()
    if (platformBrowser === 'safari' || platformBrowser === 'microsoftedge') {
      console.log('fake-selecting a fake file')
      driver.executeScript(tools.uppySelectFakeFile)
      // driver.findElement({css: '.UppyForm-uploadBtn'}).click()
    } else {
      console.log('selecting a real file')
      // Find input by css selector & pass absolute image path to it
      driver.findElement({css: '.uppy-FileInput-input'}).then(function (el) {
        el.sendKeys(path.join(__dirname, 'image.jpg'))
        // el.sendKeys(path.join(__dirname, 'image2.jpg'))
        // driver.findElement({css: '.UppyForm-uploadBtn'}).click()
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

    driver.wait(isUploaded, 12000, 'File image.jpg should be uploaded within 15 seconds')
      .then(function (result) {
        tools.testEqual(driver, t, result)
        driver.quit()
      })
      .catch(function (err) {
        tools.collectErrors(driver).then(function () {
          tools.testFail(driver, t, err)
          driver.quit()
        })
      })
  })
}
