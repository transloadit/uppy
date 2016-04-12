var test = require('tape')
var path = require('path')
var Driver = require('./Driver')
var By = Driver.By
var collectErrors = Driver.collectErrors

test('dragdrop: make sure DragDrop accepts and uploads 1 file via input', function (t) {
  t.plan(1)

  var driver = Driver.setDriver()

  // Go to the example URL
  driver.get('http://localhost:4000/examples/dragdrop/')

  // Find input by css selector & pass absolute image path to it
  driver
    .findElement(By.css('.UppyDragDrop-One .UppyDragDrop-input'))
    .sendKeys(path.join(__dirname, 'image.jpg'))

  // Get console elements’s value, then check if it has “Download” there somewhere,
  // if it does, then test passes
  function isUploaded () {
    return driver.findElement(By.id('console-log'))
      .getAttribute('value')
      .then(function (value) {
        var isFileUploaded = value.indexOf('Download image.jpg') !== -1
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
      t.fail(err)
      driver.quit()
    })
})
