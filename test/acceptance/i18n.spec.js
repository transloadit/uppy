var test = require('tape')
var Browser = require('./Browser')
var browser = Browser.setDriver()
var By = Browser.By

var config = {
  testUrl: 'http://localhost:4000/examples/i18n',
  dragDropLabelSelector: '.UppyDragDrop-label'
}

test('make sure Uppy loads with Russian language pack', function (t) {
  t.plan(1)

  // Open the page
  browser.get(config.testUrl)

  // Wait 3 seconds, for the page to load
  browser.sleep(3000)

  // Find element, get its text and check that it matches
  browser.findElement(By.css(config.dragDropLabelSelector))
    .getText()
    .then(function (val) {
      console.dir({val: val})
      t.equal(val, 'Выберите файл или перенесите его сюда')
      browser.quit()
    })
})
