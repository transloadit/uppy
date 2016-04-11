var test = require('tape')
var Driver = require('./Browser')

test('open a page, create a variable and get its value', function (t) {
  t.plan(1)

  var driver = Driver.setDriver()

  driver.get('http://ya.ru')
  driver.executeScript('window.a = "blabla";')
  driver.sleep(2000)
  driver.executeScript('return a').then(function (val) {
    console.log(val)
  })
  driver.sleep(5000)
  driver.quit()
})
