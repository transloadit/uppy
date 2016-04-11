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

  driver.sleep(3000)

  // Get console elements’s value, then check if it has “Download” there somewhere,
  // if it does, then test passes
  driver.findElement(By.id('console-log'))
        .getAttribute('value')
        .then(function (value) {
          var isFileUploaded = value.indexOf('Download') !== -1
          collectErrors(driver).then(function () {
            t.equal(isFileUploaded, true)
            driver.quit()
          })
        })

  // driver.wait(isUploadSuccessful, 5000).then(function (result) {
  //   t.equal(result, true)
  // })
  // .catch(function (err) {
  //   console.error('Something went wrong\n', err.stack, '\n')
  // })
})
