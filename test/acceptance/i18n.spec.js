var test = require('tape')
var chalk = require('chalk')
var webdriver = require('selenium-webdriver')
var By = webdriver.By
var Driver = require('./Driver')
var collectErrors = Driver.collectErrors

module.exports = function (driver, platform, host) {
  test('i18n: make sure Uppy loads with Russian language pack ' +
      chalk.underline.yellow('[' +
        platform.os + ' ' +
        platform.browser + ' ' +
        platform.version +
      ']'),
  function (t) {
    t.plan(1)

    function findLabelTextElement () {
      return driver.findElements(By.css('.UppyDragDrop-label')).then(function (result) {
        return result[0]
      })
    }

    driver.get(host + '/examples/i18n')

    driver.wait(findLabelTextElement, 8000, 'Uppy should load within 8 seconds')
      .then(function (element) {
        element.getText().then(function (value) {
          collectErrors(driver).then(function () {
            t.equal(value, 'Выберите файл или перенесите его сюда')
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
