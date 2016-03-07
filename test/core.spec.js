var test = require('tape')
var Uppy = require('../src/core/Core.js')

test('core', function (t) {
  const uppy = new Uppy()

  t.equal(typeof uppy, 'object', '`new Core()` should return an `object`')
  t.ok(uppy instanceof Uppy, '`uppy` should be an instance of `Uppy` core')
  t.end()
})

test('use plugins', function (t) {
  const AcquirePlugin = require('./mocks/plugin-acquire1.js')
  const uppy = new Uppy()
  uppy
    .use(AcquirePlugin)

  t.equal(Object.keys(uppy.plugins).length, 1, 'should add a plugin to the plugins stack')
  t.end()
})

test('noDuplicates', function (t) {
  const Acquire1Plugin = require('./mocks/plugin-acquire1.js')
  const uppyTwoAcquires = new Uppy()

  uppyTwoAcquires.use(Acquire1Plugin)
  const fn = uppyTwoAcquires.use.bind(uppyTwoAcquires, Acquire1Plugin)

  t.throws(fn, new RegExp('Uppy is currently limited to running one of every plugin'))
  t.end()
})

test('autoProceed', function (t) {
  const Acquire1Plugin = require('./mocks/plugin-acquire1.js')
  const Acquire2Plugin = require('./mocks/plugin-acquire2.js')

  const uppyOneAcquire = new Uppy()
  uppyOneAcquire
    .use(Acquire1Plugin)
    .run()

  const uppyTwoAcquires = new Uppy()
  uppyTwoAcquires
    .use(Acquire1Plugin)
    .use(Acquire2Plugin)
    .run()

  t.equal(uppyOneAcquire.opts.autoProceed, true, 'should autoProceed if only one acquire is used')
  t.equal(uppyTwoAcquires.opts.autoProceed, false, 'should not autoProceed if more than one acquire is used')
  t.end()
})
