var test = require('tape')
var path = require('path')
var core = require('./core')
var driver = core.setDriver()
var By = core.By

var config = {
  i18nTestUrl: 'http://localhost:4000/examples/i18n',
  dragDropLabelSelector: '.UppyDragDrop-label',
  imageAbsolutePath: path.join(__dirname, 'image.jpg')
}

test('make sure Uppy loads with Russian language pack', function (t) {
  t.plan(1)

  driver.get(config.i18nTestUrl)

  // Wait 3 seconds, for the page to load
  driver.sleep(3000)

  driver.findElement(By.css(config.dragDropLabelSelector))
    .getText()
    .then(function (val) {
      console.dir({val: val})
      t.equal(val, 'Выберите файл или перенесите его сюда')
    })

  driver.quit()
})
