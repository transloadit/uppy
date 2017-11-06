var webdriverio = require('webdriverio')
var path = require('path')
var options = {
  desiredCapabilities: {
    browserName: 'firefox'
  }
}

var browser = webdriverio.remote(options)
var uppyTestURL = 'http://localhost:9966'

beforeAll(() => {
  return browser
    .init()
    // .url(uppyTestURL)
})

afterAll(() => {
  return browser.end()
})

describe('Uppy end to end test', () => {
  test('search test', function () {
    return browser
      // .init()
      .url('https://duckduckgo.com/')
      .setValue('#search_form_input_homepage', 'WebdriverIO')
      .click('#search_button_homepage')
      .getTitle().then(function (title) {
        console.log(title)
        expect(title).toBe('WebdriverIO at DuckDuckGo')
      })
      // .end()
  }, 10000)

  test('another test', function () {
    return browser
      .url(uppyTestURL)
      .chooseFile('#uppyDragDrop .uppy-DragDrop-input', path.join(__dirname, 'image.jpg'))
      .pause(3000)
      .getHTML('#uppyDragDrop-progress .UppyProgressBar-percentage', false).then(val => {
        console.log(val)
        expect(parseInt(val)).toBe(100)
      })
  }, 10000)
})
