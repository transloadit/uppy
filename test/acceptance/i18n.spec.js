var test = require('tape')
var chalk = require('chalk')
var Driver = require('./Driver')
var collectErrors = Driver.collectErrors

module.exports = function (driver, platform, host) {
  var testName = 'i18n: make sure Uppy loads with Russian language pack '
  var platformName = chalk.underline.yellow('[' +
      platform.os + ' ' +
      platform.browser + ' ' +
      platform.version +
    ']')

  test(testName + ' ' + platformName, function (t) {
    t.plan(1)

    function findLabelTextElement () {
      return driver.findElements({css: '.UppyDragDrop-label'}).then(function (result) {
        return result[0]
      })
    }

    driver.get(host + '/examples/i18n')
    driver.manage().window().maximize()

    // Set Saucelabs test name
    driver.executeScript('sauce:job-name=' + testName).catch(function (err) {
      console.log('local test, so this is ok: ' + err)
    })

    driver.wait(findLabelTextElement, 8000, 'Uppy should load within 8 seconds')
      .then(function (element) {
        element.getText().then(function (value) {
          collectErrors(driver).then(function () {
            // why trim? Microsoft Edge
            // not ok 4 should be equal
            //  ---
            // operator: equal
            // expected: 'Выберите файл или перенесите его сюда'
            // actual:   'Выберите файл или перенесите его сюда '
            t.equal(value.trim(), 'Выберите файл или перенесите его сюда')
            driver.quit()
          })
        })
      })
      .catch(function (err) {
        collectErrors(driver).then(function () {
          t.fail(err)
          driver.quit()
        })
      })
  })
}
