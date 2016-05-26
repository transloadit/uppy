var test = require('tape')
var chalk = require('chalk')
var Driver = require('./Driver')

module.exports = function (driver, platform, host) {
  var testName = 'i18n: make sure Uppy loads with Russian language pack '
  var platformName = chalk.underline.yellow('[' +
      platform.os + ' ' +
      platform.browser + ' ' +
      platform.version +
    ']')

  test(testName + ' ' + platformName, function (t) {
    t.plan(1)

    driver.get(host + '/examples/i18n')
    driver.manage().window().maximize()

    Driver.setSauceTestName(driver, testName)

    function findLabelTextElement () {
      return driver.findElements({css: '.UppyDragDrop-label'}).then(function (result) {
        return result[0]
      })
    }

    driver.wait(findLabelTextElement, 8000, 'Uppy should load within 8 seconds')
      .then(function (element) {
        element.getText().then(function (value) {
          Driver.collectErrors(driver).then(function () {
            // why trim? Microsoft Edge:
            // not ok 4 should be equal
            //  ---
            // operator: equal
            // expected: 'Выберите файл или перенесите его сюда'
            // actual:   'Выберите файл или перенесите его сюда '
            Driver.testEqual(driver, t, value.trim() === 'Выберите файл или перенесите его сюда')
            // t.equal(value.trim(), 'Выберите файл или перенесите его сюда')
            // if (value.trim() === 'Выберите файл или перенесите его сюда') {
            //   setSauceTestStatus(driver, true)
            // } else {
            //   setSauceTestStatus(driver, false)
            // }
            driver.quit()
          })
        })
      })
      .catch(function (err) {
        Driver.collectErrors(driver).then(function () {
          Driver.testFail(driver, t, err)
          // t.fail(err)
          // setSauceTestStatus(driver, false)
          driver.quit()
        })
      })
  })
}
