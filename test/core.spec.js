var test = require('tape')
var Uppy = require('../src/core/Core.js')

test('core', function (t) {
  const uppy = new Uppy()

  t.equal(typeof uppy, 'object', '`new Core()` should return an `object`')
  t.ok(uppy instanceof Uppy, '`uppy` should be an instance of `Uppy` core')
  t.end()
})

test('use plugins', function (t) {
  const AcquirerPlugin = require('./mocks/plugin-acquirer1.js')
  const uppy = new Uppy()
  uppy
    .use(AcquirerPlugin)

  t.equal(Object.keys(uppy.plugins).length, 1, 'should add a plugin to the plugins stack')
  t.end()
})

test('noDuplicates', function (t) {
  const Acquirer1Plugin = require('./mocks/plugin-acquirer1.js')
  const uppyTwoAcquirers = new Uppy()

  uppyTwoAcquirers.use(Acquirer1Plugin)
  const fn = uppyTwoAcquirers.use.bind(uppyTwoAcquirers, Acquirer1Plugin)

  t.throws(fn, new RegExp('Uppy is currently limited to running one of every plugin'))
  t.end()
})

test('autoProceed', function (t) {
  const Acquirer1Plugin = require('./mocks/plugin-acquirer1.js')
  const Acquirer2Plugin = require('./mocks/plugin-acquirer2.js')

  const uppyOneAcquirer = new Uppy()
  uppyOneAcquirer
    .use(Acquirer1Plugin)
    .run()

  const uppyTwoAcquirers = new Uppy()
  uppyTwoAcquirers
    .use(Acquirer1Plugin)
    .use(Acquirer2Plugin)
    .run()

  t.equal(uppyOneAcquirer.opts.autoProceed, true, 'should autoProceed if only one acquirer is used')
  t.equal(uppyTwoAcquirers.opts.autoProceed, false, 'should not autoProceed if more than one acquirer is used')
  t.end()
})
