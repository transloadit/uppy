const base = require('./wdio.base.conf')

// Use "npm run test:endtoend:local -- -b chrome" to test in chrome
// "npm run test:endtoend:local -- -b firefox -b chrome" to test in FF and chrome
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

exports.config = {
  ...base.config,

  capabilities,

  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,

  // Set a base URL in order to shorten url command calls. If your url parameter starts
  // with "/", then the base url gets prepended.
  baseUrl: 'http://localhost',

  // Options to be passed to Mocha.
  // See the full list at http://mochajs.org/
  mochaOpts: {
    ui: 'bdd',
    reporter: 'dot',
    timeout: 120000
  }
}
