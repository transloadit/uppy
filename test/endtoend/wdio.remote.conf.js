const base = require('./wdio.base.conf')

function createCapability (capability) {
  return {
    'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
    build: process.env.TRAVIS_BUILD_NUMBER,
    extendedDebugging: true,
    ...capability
  }
}

exports.config = {
  ...base.config,

  logLevel: 'warn',

  capabilities: [
    // Previous ESR
    { browserName: 'firefox', version: '52.0', platform: 'Windows 7' },
    // Current ESR
    { browserName: 'firefox', version: '62.0', platform: 'Windows 10' },
    { browserName: 'internet explorer', version: '10.0', platform: 'Windows 8' },
    { browserName: 'internet explorer', version: '11.0', platform: 'Windows 10' },
    { browserName: 'chrome', version: '70.0', platform: 'Windows 10' },
    { browserName: 'MicrosoftEdge', version: '14', platform: 'Windows 10' },
    { browserName: 'MicrosoftEdge', version: '17', platform: 'Windows 10' },
    // { browserName: 'safari', version: '11.0', platform: 'macOS 10.12' },
    // { browserName: 'Safari', platformName: 'iOS', platformVersion: '12.2', deviceOrientation: 'portrait', deviceName: 'iPhone 8 Simulator' },
    { browserName: 'chrome', platformName: 'Android', platformVersion: '6.0', deviceOrientation: 'portrait', deviceName: 'Android Emulator' }
  ].map(createCapability),

  // Patterns to exclude.
  exclude: [
    'test/endtoend/url-plugin/*',
    'test/endtoend/transloadit/*'
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
    'sauce'
  ],
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY
}
