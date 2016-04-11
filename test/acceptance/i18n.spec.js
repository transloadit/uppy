var test = require('tape')
var Driver = require('./Driver')
var By = Driver.By
var collectErrors = Driver.collectErrors

test('i18n: make sure Uppy loads with Russian language pack', function (t) {
  t.plan(1)

  var driver = Driver.setDriver()

  function findLabelTextElement () {
    return driver.findElements(By.css('.UppyDragDrop-label')).then(function (result) {
      return result[0]
    })
  }

  driver.get('http://localhost:4000/examples/i18n')

  driver.wait(findLabelTextElement, 8000, 'Uppy should load within 8 seconds')
    .then(function (element) {
      element.getText().then(function (value) {
        collectErrors(driver).then(function () {
          t.equal(value, 'Выберите файл или перенесите его сюда')
          driver.quit()
        })
      })
    })
    .catch(function (err) {
      t.fail(err)
      driver.quit()
    })
})
