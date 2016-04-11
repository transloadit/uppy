var test = require('tape')
var Driver = require('./Driver')
var By = Driver.By
var collectErrors = Driver.collectErrors

test('make sure Uppy loads with Russian language pack', function (t) {
  t.plan(1)

  var driver = Driver.setDriver()

  driver.get('http://localhost:4000/examples/i18n')
  driver
    .findElement(By.css('.UppyDragDrop-label'))
    .getText()
    .then(function (value) {
      collectErrors(driver).then(function () {
        t.equal(value, 'Выберите файл или перенесите его сюда')
        driver.quit()
      })
    })
})
