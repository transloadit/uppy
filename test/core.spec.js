var test = require('tape')
var Uppy = require('../src/core/Core.js')

test('core', function (t) {
  const uppy = new Uppy()

  t.equal(typeof uppy, 'object', '`new Core()` should return an `object`')
  t.equal(uppy instanceof Uppy, true, '`uppy` should be an instance of `Uppy` core')
  t.end()
})

test('use plugins', function (t) {
  const SelecterPlugin = require('./mocks/plugin-selecter.js')
  const uppy = new Uppy()
  uppy
    .use(SelecterPlugin)

  t.equal(Object.keys(uppy.plugins).length, 1, 'should add a plugin to the plugins stack')
  t.end()
})

test('autoProceed', function (t) {
  const SelecterPlugin = require('./mocks/plugin-selecter.js')

  const uppyOneSelecter = new Uppy()
  uppyOneSelecter
    .use(SelecterPlugin)
    .run()

  const uppyTwoSelecters = new Uppy()
  uppyTwoSelecters
    .use(SelecterPlugin)
    .use(SelecterPlugin)
    .run()

  t.equal(uppyOneSelecter.opts.autoProceed, true, 'should autoProceed if only one selecter is used')
  t.equal(uppyTwoSelecters.opts.autoProceed, false, 'should not autoProceed if more than one selecter is used')
  t.end()
})
