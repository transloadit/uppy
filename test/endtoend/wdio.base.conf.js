const glob = require('glob').sync
const path = require('path')

const suites = {}
glob('test/endtoend/*/test.js').forEach((file) => {
  const name = path.basename(path.dirname(file))
  suites[name] = [file]
})

exports.config = {
  // ==================
  // Specify Test Files
  // ==================
  // Define which test specs should run. The pattern is relative to the directory
  // from which `wdio` was called. Notice that, if you are calling `wdio` from an
  // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
  // directory is where your package.json resides, so `wdio` will be called from there.
  //
  specs: [
    'test/endtoend/*/test.js'
  ],

  // Patterns to exclude.
  exclude: [
    // 'path/to/excluded/files'
  ],

  // Suites allows you to do `wdio config.js --suite $name` to run a subset of tests.
  suites,

  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
  // time. Depending on the number of capabilities, WebdriverIO launches several test
  // sessions. Within your capabilities you can overwrite the spec and exclude options in
  // order to group specific specs to a specific capability.
  //
  // First, you can define how many instances should be started at the same time. Let's
  // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
  // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
  // files and you set maxInstances to 10, all spec files will get tested at the same time
  // and 30 processes will get spawned. The property handles how many capabilities
  // from the same test should run tests.
  maxInstances: 5,

  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // By default WebdriverIO commands are executed in a synchronous way using
  // the wdio-sync package. If you still want to run your tests in an async way
  // e.g. using promises you can set the sync option to false.
  sync: true,

  // Level of logging verbosity: silent | verbose | command | data | result | error
  logLevel: 'silent',

  // Enables colors for log output.
  coloredLogs: true,

  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,

  // Saves a screenshot to a given path if a command fails.
  // screenshotPath: './endtoend/screenshots',
  //
  // Set a base URL in order to shorten url command calls. If your url parameter starts
  // with "/", then the base url gets prepended.
  baseUrl: 'http://localhost',

  // Default timeout for all waitFor* commands.
  waitforTimeout: 10000,

  // Default timeout in milliseconds for request
  // if Selenium Grid doesn't send response
  connectionRetryTimeout: 90000,

  // Default request retries count
  connectionRetryCount: 3,

  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  services: ['static-server'],

  staticServerFolders: [
    { mount: '/i18n-drag-drop', path: './test/endtoend/i18n-drag-drop/dist' },
    { mount: '/tus-drag-drop', path: './test/endtoend/tus-drag-drop/dist' },
    { mount: '/xhr-limit', path: './test/endtoend/xhr-limit/dist' },
    { mount: '/providers', path: './test/endtoend/providers/dist' },
    { mount: '/thumbnails', path: './test/endtoend/thumbnails/dist' },
    { mount: '/create-react-app', path: './test/endtoend/create-react-app/build' }
  ],

  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: http://webdriver.io/guide/testrunner/frameworks.html
  //
  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: 'mocha',

  // Options to be passed to Mocha.
  // See the full list at http://mochajs.org/
  mochaOpts: {
    ui: 'dot',
    timeout: 30000
  },

  /**
   * Gets executed before test execution begins. At this point you can access to all global
   * variables like `browser`. It is the perfect place to define custom commands.
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs List of spec file paths that are to be run
   */
  before: function (capabilities, specs) {
    var chai = require('chai')
    global.expect = chai.expect
    global.capabilities = capabilities
    chai.Should()
  }
}
