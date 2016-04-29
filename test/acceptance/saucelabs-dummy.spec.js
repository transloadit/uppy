var webdriver = require('selenium-webdriver')
var remote = require('selenium-webdriver/remote')

var username = process.env.USERNAME
var accessKey = process.env.ACCESS_KEY

var platform = { browser: 'firefox', version: '34.0', os: 'Windows 7' }

function buildDriver (platform) {
  var driver = new webdriver
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
  return driver
}

function runTest (driver, platform) {
  console.log('Running dummy test in ' + platform.browser + ' on ' + platform.os)
  driver.get('http://ya.ru')
  return driver.getTitle().then(function (title) {
    console.log('title is: ' + title)
    console.log('Finnished running dummy test, I quit!')
    driver.quit()
  })
}

var driver = buildDriver(platform)
runTest(driver, platform)
