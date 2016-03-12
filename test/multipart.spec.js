var test = require('tape')
var webdriver = require('selenium-webdriver')

test('upload two files', function (t) {
  var driver = new webdriver.Builder()
  .withCapabilities(webdriver.Capabilities.chrome())
  .build()

  driver.get('http://www.uppy.io/examples/multipart/')
  driver.findElement(webdriver.By.id('file1')).sendKeys('./dummyFile')
  driver.findElement(webdriver.By.id('file2')).sendKeys('./dummyFile2')
  driver.findElement(webdriver.By.id('myupload')).click()
  // driver.wait
  // check for success
  driver.quit()

  t.end()
})
