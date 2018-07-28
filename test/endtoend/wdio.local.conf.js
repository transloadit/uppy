const base = require('./wdio.base.conf')

exports.config = Object.assign(base.config, {
  capabilities: [
    { browserName: 'firefox' }
    // { browserName: 'MicrosoftEdge', version: '14.14393', platform: 'Windows 10' },
    // { browserName: 'safari', version: '11.0', platform: 'macOS 10.12' }
  ],

  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,

  // Set a base URL in order to shorten url command calls. If your url parameter starts
  // with "/", then the base url gets prepended.
  baseUrl: 'http://localhost',

  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  services: ['static-server']
})
