const base = require('./wdio.base.conf')

function createCapability (capability) {
  return {
    'sauce:options': {
      tunnelIdentifier: process.env.SAUCE_TUNNEL_IDENTIFIER,
      build: process.env.SAUCE_BUILD,
      extendedDebugging: true,
    },
    ...capability,
  }
}

exports.config = {
  ...base.config,

  logLevel: 'warn',

  capabilities: [
    { browserName: 'firefox', browserVersion: 'latest', platformName: 'Windows 10' },
    { browserName: 'firefox', browserVersion: 'latest-1', platformName: 'Windows 10' },
    { browserName: 'chrome', browserVersion: 'latest', platformName: 'Windows 10' },
    { browserName: 'chrome', browserVersion: 'latest-1', platformName: 'Windows 10' },
    { browserName: 'safari', browserVersion: 'latest', platformName: 'macOS 11' },
    { browserName: 'safari', browserVersion: '13.1', platformName: 'macOS 10.15' },
    { browserName: 'Safari', 'appium:deviceName': 'iPhone 12 Simulator', 'appium:deviceOrientation': 'portrait', 'appium:platformVersion': '14.3', platformName:'iOS' },
    // { browserName: 'Chrome', 'appium:deviceName': 'Android GoogleAPI Emulator', 'appium:deviceOrientation': 'portrait', 'a
    // ppium:platformVersion': '11.0', platformName: 'Android' },
  ].map(createCapability),

  // Patterns to exclude.
  exclude: [
    './chaos-monkey/*',
    './url-plugin/*',
    './transloadit/*',
  ],

  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 3,

  // Set a base URL in order to shorten url command calls. If your url parameter starts
  // with "/", then the base url gets prepended.
  baseUrl: 'http://localhost',

  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  services: [
    ...base.config.services,
    'sauce',
  ],
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
}
