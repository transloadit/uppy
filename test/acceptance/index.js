// Docs aren't that great to find. Mostly JAVA based. Here are few helpful resources:
// - https://www.browserstack.com/automate/node#testing-frameworks
// - http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/firefox/index_exports_Driver.html
// - https://github.com/SeleniumHQ/selenium/blob/8f988e07cc316a48e0ff94d8ff823c95142532e9/javascript/webdriver/webdriver.js
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

// The Travis Sauce Connect addon exports the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables,
// and relays connections to the hub URL back to Sauce Labs.
// See: https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-Sauce-Labs
var username = process.env.SAUCE_USERNAME
var accessKey = process.env.SAUCE_ACCESS_KEY

var remoteHost = 'http://uppy.io'
var localHost = 'http://localhost:4000'

// if accessKey is supplied as env variable, this is a remote Saucelabs test
var isTravisTest = process.env.TRAVIS === 'true'
var isRemoteTest = !!accessKey

var host = localHost
if (isTravisTest) {
  // @todo This should become localhost to utilize the Travis saucelabs addon tunnel
  // But it seems Edge and Safari fail on that right now, so targeting uppy.io instead.
  // That is unideal, as we are then testing a previous deploy, and not the current build
  // host = localHost
  host = remoteHost
} else if (isRemoteTest) {
  // We're not too sure about a working tunnel otherwise, best just test uppy.io
  host = remoteHost
} else {
  // If we don't have any access keys set, we'll assume you'll be playing around with a local
  // firefox webdriver.
  host = localHost
}

console.log('Acceptance tests will be targetting: ' + host)

var platforms = [
  // { browser: 'Safari', version: '8.0', os: 'OS X 10.10' },
  // { browser: 'MicrosoftEdge', version: '13.10586', os: 'Windows 10' },
  { browser: 'Firefox', version: '38.0', os: 'Linux' },
  { browser: 'Internet Explorer', version: '10.0', os: 'Windows 8' },
  { browser: 'Internet Explorer', version: '11.103', os: 'Windows 10' },
  { browser: 'Chrome', version: '48.0', os: 'Windows XP' },
  { browser: 'Firefox', version: '34.0', os: 'Windows 7' }
]

var tests = [
  require('./multipart.spec.js'),
  require('./i18n.spec.js')
  // require('./dragdrop.spec.js')
]

function buildDriver (platform) {
  var driver
  if (isRemoteTest) {
    var capabilities = {
      'browserName': platform.browser,
      'platform': platform.os,
      'version': platform.version,
      'username': username,
      'accessKey': accessKey,
      'unexpectedAlertBehaviour': 'dismiss'
    }

    if (isTravisTest) {
      // @todo Do we need a hub_url = "%s:%s@localhost:4445" % (username, access_key)
      // as mentioned in https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-Sauce-Labs ?
      capabilities['tunnel-identifier'] = process.env.TRAVIS_JOB_NUMBER
      capabilities['build'] = process.env.TRAVIS_BUILD_NUMBER
      capabilities['name'] = 'Travis ##' + process.env.TRAVIS_JOB_NUMBER
      capabilities['tags'] = [process.env.TRAVIS_NODE_VERSION, 'CI']
    }

    driver = new webdriver
      .Builder()
      .withCapabilities(capabilities)
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

var customTests = {
  fallback: function () {
    var ancientPlatform = { browser: 'internet explorer', version: '6.0', os: 'Windows XP' }
    var driver = buildDriver({ browser: 'internet explorer', version: '6.0', os: 'Windows XP' })
    var test = require('./fallback.spec.js')

    test(driver, ancientPlatform, host)
  }
}

// RUN TESTS

function runAllTests () {
  if (isRemoteTest) {
    // run all tests for all platforms
    platforms.forEach(function (platform) {
      tests.forEach(function (test) {
        var driver = buildDriver(platform)
        test(driver, platform, host)
      })
    })

    // run custom platform-specific tests here
    // fallback test
    customTests.fallback()
  } else {
    // run tests just for local Firefox
    tests.forEach(function (test) {
      var driver = buildDriver()
      test(driver, { browser: 'Firefox', version: 'Version', os: 'Local' }, host)
    })
  }
}

runAllTests()
