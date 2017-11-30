var test = require('tape')
var webdriver = require('selenium-webdriver')

var driver = new webdriver
  .Builder()
  .forBrowser('firefox')
  .build()

test('open a page, create a variable and get its value', function (t) {
  t.plan(1)

  driver.get('http://ya.ru')
  driver.executeScript('window.a = "blabla";')
  driver.sleep(2000)
  driver.executeScript('return a').then(function (val) {
    console.log(val)
    t.equal(val, 'blabla')
  })
  driver.sleep(5000)
  driver.quit()
})
