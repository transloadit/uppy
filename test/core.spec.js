var test = require('tape')
var Uppy = require('../src/core/Core.js')

test('core', function (t) {
  const uppy = new Uppy()

  t.equal(typeof uppy, 'object', '`new Core()` should return an `object`')
  t.ok(uppy instanceof Uppy, '`uppy` should be an instance of `Uppy` core')
  t.end()
})

test('use plugins', function (t) {
  const SelecterPlugin = require('./mocks/plugin-selecter1.js')
  const uppy = new Uppy()
  uppy
    .use(SelecterPlugin)

  t.equal(Object.keys(uppy.plugins).length, 1, 'should add a plugin to the plugins stack')
  t.end()
})

test('noDuplicates', function (t) {
  const Selecter1Plugin = require('./mocks/plugin-selecter1.js')
  const uppyTwoSelecters = new Uppy()
  let err = ''
  try {
    uppyTwoSelecters
    .use(Selecter1Plugin)
    .use(Selecter1Plugin)
    .run()
  } catch (e) {
    err = e.message
  }

  t.equal(err, 'Uppy is currently limited to running one of every plugin. Share your use case with us over at https://github.com/transloadit/uppy/issues/ if you want us to reconsider.', 'should throw error on use of duplicate plugin')
  t.end()
})

test('autoProceed', function (t) {
  const Selecter1Plugin = require('./mocks/plugin-selecter1.js')
  const Selecter2Plugin = require('./mocks/plugin-selecter2.js')

  const uppyOneSelecter = new Uppy()
  uppyOneSelecter
    .use(Selecter1Plugin)
    .run()

  const uppyTwoSelecters = new Uppy()
  uppyTwoSelecters
    .use(Selecter1Plugin)
    .use(Selecter2Plugin)
    .run()

  t.equal(uppyOneSelecter.opts.autoProceed, true, 'should autoProceed if only one selecter is used')
  t.equal(uppyTwoSelecters.opts.autoProceed, false, 'should not autoProceed if more than one selecter is used')
  t.end()
})
