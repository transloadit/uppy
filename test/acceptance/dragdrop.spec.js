var test = require('tape')
var path = require('path')
var core = require('./core')

var config = {
  dragDropTestUrl: 'http://localhost:4000/examples/dragdrop/',
  dragDropInputSelector: '.UppyDragDrop-One .UppyDragDrop-input',
  imageAbsolutePath: path.join(__dirname, 'image.jpg')
}

test('dragdrop: make sure DragDrop accepts and uploads 1 file via input', function (t) {
  t.plan(1)

  // Go to the example URL
  core.driver.get(config.dragDropTestUrl)

  // Find input by css selector
  var input = core.driver.findElement(core.By.css(config.dragDropInputSelector))

  // Pass absolute image path to the input
  input.sendKeys(config.imageAbsolutePath)

  // Wait for a while for upload to go through
  core.driver.sleep(3000)

  // Get console elements’s value, then check if it has “Download” there somewhere,
  // if it does, then test passes
  core.consoleElement.getAttribute('value').then(function (value) {
    var isFileUploaded = value.indexOf('Download') !== -1
    t.equal(isFileUploaded, true)
  })

  core.driver.quit()
})
