var test = require('tape')
var path = require('path')
var tools = require('./tools')

module.exports = function (driver, platform, host) {
  var testName = 'DragDrop: upload one file'

  test(tools.prettyTestName(testName, platform), function (t) {
    t.plan(1)

    // Go to the example URL
    driver.get(host + '/examples/dragdrop/')
    driver.manage().window().maximize()

    // Set Saucelabs test name
    tools.setSauceTestName(driver, testName)

    driver.executeScript(tools.uppySelectFakeFile)
    driver.findElement({css: '.UppyDragDrop-Two-Upload'}).click()

    var platformBrowser = platform.browser.toLowerCase()
    if (platformBrowser === 'safari' || platformBrowser === 'microsoftedge') {
      console.log('fake-selecting a fake file')
      driver.executeScript(tools.uppySelectFakeFile)
      driver.findElement({css: '.UppyDragDrop-Two-Upload'}).click()
    } else {
      console.log('selecting a real file')
      // Make file input “visible”
      driver.executeScript('document.querySelector(".UppyDragDrop-One .uppy-DragDrop-input").style.opacity = 1')

      // Find input by css selector & pass absolute image path to it
      driver
        .findElement({css: '.UppyDragDrop-One .uppy-DragDrop-input'})
        .sendKeys(path.join(__dirname, 'image.jpg'))
    }

    function isUploaded () {
      // return driver.findElement(By.id('console-log'))
      //   .getAttribute('value')
      //   .then(function (value) {
      //     var isFileUploaded = value.indexOf('Download image.jpg') !== -1
      //     return isFileUploaded
      //   })

      // .getText() only work on visible elements, so we use .getAttribute('textContent'), go figure
      // http://stackoverflow.com/questions/21994261/gettext-not-working-on-a-select-from-dropdown

      // TODO: figure out how to deal with multiple Uppy instances on the page
      return driver.findElement({css: '.UppyDragDrop-One-Progress .UppyProgressBar-percentage'})
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
