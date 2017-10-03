var test = require('tape')
var tools = require('./tools')

module.exports = function (driver, platform, host) {
  var testName = 'i18n: load DragDrop with Russian localization strings'

  test(tools.prettyTestName(testName, platform), function (t) {
    t.plan(1)

    driver.get(host + '/examples/i18n')
    driver.manage().window().maximize()

    tools.setSauceTestName(driver, testName)

    function findLabelTextElement () {
      return driver.findElements({css: '.uppy-DragDrop-label'}).then(function (result) {
        return result[0]
      })
    }

    driver.wait(findLabelTextElement, 8000, 'Uppy should load within 8 seconds')
      .then(function (element) {
        element.getText().then(function (value) {
          // why trim? Microsoft Edge:
          // expected: 'Выберите файл или перенесите его сюда'
          // actual:   'Выберите файл или перенесите его сюда '
          var expectedValue = 'Перенесите файлы сюда или выберите'
          console.log(value, '/', expectedValue)
          tools.testEqual(driver, t, value.trim() === expectedValue)
          driver.quit()
        })
      })
      .catch(function (err) {
        tools.collectErrors(driver).then(function () {
          tools.testFail(driver, t, err)
          driver.quit()
        })
      })
  })
}
