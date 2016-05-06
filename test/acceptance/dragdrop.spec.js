var test = require('tape')
var path = require('path')
var chalk = require('chalk')
var Driver = require('./Driver')
var collectErrors = Driver.collectErrors

module.exports = function (driver, platform, host) {
  test('dragdrop: make sure DragDrop accepts and uploads 1 file via input ' +
      chalk.underline.yellow('[' +
        platform.os + ' ' +
        platform.browser + ' ' +
        platform.version +
      ']'),
  function (t) {
    t.plan(1)

    // Go to the example URL
    driver.get(host + '/examples/dragdrop/')

    var platformBrowser = platform.browser.toLowerCase()
    if (platformBrowser === 'safari' || platformBrowser === 'microsoftedge') {
      console.log('fake-selecting a fake file')
      driver.executeScript(Driver.UppySelectFakeFile)
    } else {
      console.log('selecting a real file')
      // Make file input “visible”
      driver.executeScript('document.querySelector(".UppyDragDrop-One .UppyDragDrop-input").style.opacity = 1')
      // Find input by css selector & pass absolute image path to it
      driver
        .findElement({css: '.UppyDragDrop-One .UppyDragDrop-input'})
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
      return driver.findElement({css: '.UppyDragDrop-One-Progress .UppyProgressBar-percentage'})
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
