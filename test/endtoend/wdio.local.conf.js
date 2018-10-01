const base = require('./wdio.base.conf')
const { CompanionService } = require('./utils')

// Use "npm run test:acceptance:local -- -b chrome" to test in chrome
// "npm run test:acceptance:local -- -b firefox -b chrome" to test in FF and chrome
let prevIsDashB = false
const capabilities = []
process.argv.forEach((arg) => {
  if (prevIsDashB) {
    capabilities.push({ browserName: arg })
  }
  prevIsDashB = arg === '-b'
})

// default to testing in firefox
if (capabilities.length === 0) {
  capabilities.push({ browserName: 'firefox' })
}

exports.config = Object.assign(base.config, {
  capabilities,

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
  services: ['static-server', new CompanionService()],

  // Options to be passed to Mocha.
  // See the full list at http://mochajs.org/
  mochaOpts: {
    ui: 'dot',
    timeout: 60000
  }
})
