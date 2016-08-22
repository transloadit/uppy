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

    console.log('0')
    driver.get(host + '/examples/multipart')

    console.log('1')
    driver.manage().window().maximize()

    console.log('2')
    Driver.setSauceTestName(driver, testName)

    console.log('3')
    driver
      .findElement({css: '.UppyForm input'})
      .sendKeys(path.join(__dirname, 'image.jpg'))

    // driver.switchTo().alert().dismiss()
    //   .catch(function (err) {
    //     console.log(err)
    //   })

    console.log('4')
    driver.findElement({css: '.UppyForm button'}).click()

    function isRedirectedAfterUpload () {
      // this should close the “Do you want to save this file?” alert when Travis runs the test

      return driver.getCurrentUrl().then(function (val) {
        console.log('current url is ', val)
        var isPageRedirected = val.indexOf('api2.transloadit.com') !== -1
        return isPageRedirected
      })
    }

    console.log('5')
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
