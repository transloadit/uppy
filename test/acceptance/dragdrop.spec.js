var test = require('tape')
var path = require('path')
var Browser = require('./Browser')
var browser = Browser.setDriver()
var By = Browser.By

var config = {
  testUrl: 'http://localhost:4000/examples/dragdrop/',
  dragDropInputSelector: '.UppyDragDrop-One .UppyDragDrop-input',
  imagePath: path.join(__dirname, 'image.jpg')
}

var consoleElement = browser.findElement(By.id('console-log'))

test('dragdrop: make sure DragDrop accepts and uploads 1 file via input', function (t) {
  t.plan(1)

  // Go to the example URL
  browser.get(config.testUrl)

  // Find input by css selector
  var input = browser.findElement(By.css(config.dragDropInputSelector))

  // Pass absolute image path to the input
  input.sendKeys(config.imagePath)

  // Wait for a while for upload to go through
  browser.sleep(3000)

  // Get console elements’s value, then check if it has “Download” there somewhere,
  // if it does, then test passes
  consoleElement.getAttribute('value').then(function (value) {
    var isFileUploaded = value.indexOf('Download') !== -1
    t.equal(isFileUploaded, true)
    browser.quit()
  })
})
