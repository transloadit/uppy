var test = require('tape')
// var path = require('path')
var webdriver = require('selenium-webdriver')
var By = webdriver.By

test('upload two files', function (t) {
  // Create a new webdriver instance
  var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.firefox())
    .build()

  driver.get('http://localhost:4000/examples/i18n/')

  // Our success/fail message will be logged in the console element
  var consoleElement = driver.findElement(By.id('console-log'))

  // Wait for our upload message to be logged
  driver.wait(isLoaded.bind(this, consoleElement))

  // Get the result of our upload and test it
  getElementValue(consoleElement)
    .then(function (value) {
      var result = value.split('\n')[0]
      t.equal(result, '--> Uppy Bundled version with Tus10 & Russian language pack has loaded')
    })

  driver.quit()

  t.end()

  /**
   * Check if uploading is finished by looking for a result message
   * in the example's console output element.
   * @return {Boolean} If uploading is complete
   */
  function isLoaded (consoleElement) {
    return getElementValue(consoleElement)
      .then(function (value) {
        return value.indexOf('-->') !== -1
      })
  }

  /**
   * Get value attribute of element
   * @param  {webdriver.WebElement} element Selenium element object
   * @return {webdriver.promise} Promise resolving to element value
   */
  function getElementValue (element) {
    return element.getAttribute('value')
      .then(function (value) {
        return value
      })
  }
})
