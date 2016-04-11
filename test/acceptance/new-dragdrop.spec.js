var test = require('tape')
var path = require('path')
var webdriver = require('selenium-webdriver')
var By = require('selenium-webdriver').By

test('dragdrop: make sure DragDrop accepts and uploads 1 file via input', function (t) {
  t.plan(1)

  var driver = new webdriver.Builder()
      .forBrowser('firefox')
      .build()

  function isUploadSuccessful () {
    var consoleElement = driver.findElement(By.id('console-log'))
    return consoleElement.getAttribute('value').then(function (value) {
      var isFileUploaded = value.indexOf('Download') !== -1
      return isFileUploaded
    })
  }

  // Go to the example URL
  driver.get('http://localhost:4000/examples/dragdrop/')

  // Find input by css selector & pass absolute image path to it
  driver
    .findElement(By.css('.UppyDragDrop-One .UppyDragDrop-input'))
    .sendKeys(path.join(__dirname, 'image.jpg'))

  // Get console elements’s value, then check if it has “Download” there somewhere,
  // if it does, then test passes
  driver.wait(isUploadSuccessful, 5000).then(function (result) {
    t.equal(result, true)
  })
  .catch(function (err) {
    console.error('Something went wrong\n', err.stack, '\n')
  })

  driver.quit()
})
