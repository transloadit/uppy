var test = require('tape')
var webdriver = require('selenium-webdriver')
var By = require('selenium-webdriver').By

test('make sure Uppy loads with Russian language pack', function (t) {
  t.plan(1)
  var driver = new webdriver.Builder()
      .forBrowser('firefox')
      .build()

  driver.get('http://localhost:4000/examples/i18n')
  driver.findElement(By.css('.UppyDragDrop-label'))
        .getText()
        .then(function (val) {
          console.dir({val: val})
          t.equal(val, 'Выберите файл или перенесите его сюда')
        })
  driver.quit()
  // driver.wait(function () {
  //   return driver.getTitle().then(function (title) {
  //     return title === 'webdriver - Google Search'
  //   })
  // }, 1000)
})
