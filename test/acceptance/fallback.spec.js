var test = require('tape')
var path = require('path')
var chalk = require('chalk')
var Driver = require('./Driver')

module.exports = function (driver, platform, host) {
  var testName = 'fallback: fall back to regular <form> upload when JS is not working, or not loaded yet, or browser is not supported by Uppy'
  var platformName = chalk.underline.yellow('[' +
      platform.os + ' ' +
      platform.browser + ' ' +
      platform.version +
    ']')

  test(testName + ' ' + platformName, function (t) {
    t.plan(1)

    driver.get(host + '/examples/multipart')
    driver.manage().window().maximize()

    Driver.setSauceTestName(driver, testName)

    driver
      .findElement({css: '.UppyForm input'})
      .sendKeys(path.join(__dirname, 'image.jpg'))

    driver.findElement({css: '.UppyForm button'}).click()

    function isRedirectedAfterUpload () {
      // this should close the “Do you want to save this file?” alert when Travis runs the test
      // driver.switchTo().alert().dismiss()
      //   .catch(function (err) {
      //     console.log(err)
      //   })

      return driver.getCurrentUrl().then(function (val) {
        console.log('current url is ', val)
        var isPageRedirected = val.indexOf('api2.transloadit.com') !== -1
        return isPageRedirected
      })
    }

    driver.wait(isRedirectedAfterUpload, 12000, 'Browser should navigate to api2.transloadit.com after upload')
      .then(function (isPageRedirected) {
        Driver.collectErrors(driver).then(function () {
          Driver.testEqual(driver, t, isPageRedirected === true)
          driver.quit()
        })
      })
      .catch(function (err) {
        Driver.collectErrors(driver).then(function () {
          Driver.testFail(driver, t, err)
          driver.quit()
        })
      })
  })
}
