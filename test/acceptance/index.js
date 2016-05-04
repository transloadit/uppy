// Docs aren't that great to find. Mostly JAVA based. Here are few helpful resources:
// - https://www.browserstack.com/automate/node#testing-frameworks
// - http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/firefox/index_exports_Driver.html
// - https://github.com/SeleniumHQ/selenium/blob/c10e8a955883f004452cdde18096d70738397788/javascript/node/selenium-webdriver/test/upload_test.js
//
// - https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs
// - http://seleniumhq.github.io/selenium/docs/api/javascript/
// - http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/firefox/index.html
// - http://selenium.googlecode.com/git/docs/api/javascript/namespace_webdriver_By.html
// - http://selenium.googlecode.com/git/docs/api/javascript/class_webdriver_WebElement.html

require('babel-register')

var webdriver = require('selenium-webdriver')
var remote = require('selenium-webdriver/remote')

var username = process.env.SAUCELABS_USERNAME
var accessKey = process.env.SAUCELABS_ACCESS_KEY

// if accessKey is supplied as env variable, this is a remote Saucelabs test
var isRemoteTest = accessKey ? true : ''
var host = isRemoteTest ? 'http://uppy.io' : 'http://localhost:4000'

// FYI: old Chrome on Windows XP,
// Opera 12 on Linux — didn’t pass
var platforms = [
  // { browser: 'Opera', version: '12.15', os: 'Linux' },
  // { browser: 'iphone', version: '9.2', os: 'OS X 10.10' },
  // { browser: 'Safari', version: '8.0', os: 'OS X 10.10' },
  { browser: 'Internet Explorer', version: '10.0', os: 'Windows 8' },
  { browser: 'Internet Explorer', version: '11.103', os: 'Windows 10' },
  { browser: 'Firefox', version: '34.0', os: 'Windows 7' },
  { browser: 'Chrome', version: '48.0', os: 'Windows XP' },
  { browser: 'Firefox', version: '38.0', os: 'Linux' }
]

var tests = [
  require('./multipart.spec.js'),
  require('./i18n.spec.js'),
  require('./dragdrop.spec.js')
]

function buildDriver (platform) {
  var driver
  if (isRemoteTest) {
    driver = new webdriver
      .Builder()
      .withCapabilities({
        'browserName': platform.browser,
        'platform': platform.os,
        'version': platform.version,
        'username': username,
        'accessKey': accessKey
      })
      .usingServer('http://' + username + ':' + accessKey +
                   '@ondemand.saucelabs.com:80/wd/hub')
      .build()
    driver.setFileDetector(new remote.FileDetector())
  } else {
    driver = new webdriver
      .Builder()
      .forBrowser('firefox')
      .build()
  }
  return driver
}

if (isRemoteTest) {
  platforms.forEach(function (platform) {
    tests.forEach(function (test) {
      var driver = buildDriver(platform)
      test(driver, platform, host)
    })
  })
} else {
  tests.forEach(function (test) {
    var driver = buildDriver()
    test(driver, { browser: 'Firefox', version: 'Version', os: 'Local' }, host)
  })
}
