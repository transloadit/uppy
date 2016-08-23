var test = require('tape')
var path = require('path')
var tools = require('./tools')

module.exports = function (driver, platform, host) {
  var testName = 'Fallback: fall back to regular <form> upload when JS is not working, or not loaded yet, or browser is not supported by Uppy'

  test(tools.prettyTestName(testName, platform), function (t) {
    t.plan(1)

    driver.get(host + '/examples/multipart/index.html')

    driver.manage().window().maximize()

    tools.setSauceTestName(driver, testName)

    driver
      .findElement({css: '.UppyForm input'})
      .sendKeys(path.join(__dirname, 'image.jpg'))

    // driver.switchTo().alert().dismiss()
    //   .catch(function (err) {
    //     console.log(err)
    //   })
    driver.findElement({css: '.UppyForm button'}).click()

    function isRedirectedAfterUpload () {
      // this should close the “Do you want to save this file?” alert when Travis runs the test

      return driver.getCurrentUrl().then(function (val) {
        console.log('current url is ', val)
        var isPageRedirected = val.indexOf('api2.transloadit.com') !== -1
        return isPageRedirected
      })
    }

    driver.wait(isRedirectedAfterUpload, 12000, 'Browser should navigate to api2.transloadit.com after upload')
      .then(function (isPageRedirected) {
        tools.testEqual(driver, t, isPageRedirected === true)
        driver.quit()
      })
      .catch(function (err) {
        tools.collectErrors(driver).then(function () {
          tools.testFail(driver, t, err)
          driver.quit()
        })
      })
  })
}
