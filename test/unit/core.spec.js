import test from 'tape'
import Core from '../../src/core/Core.js'
import Acquirer1Plugin from './mocks/plugin-acquirer1.js'
// import Acquirer2Plugin from './mocks/plugin-acquirer2.js'

test('core', function (t) {
  const uppy = new Core()

  t.equal(typeof uppy, 'object', '`new Core()` should return an `object`')
  t.ok(uppy instanceof Core, '`uppy` should be an instance of `Core` core')
  t.end()
})

test('use plugins', function (t) {
  const uppy = new Core()
  uppy
    .use(Acquirer1Plugin)

  t.equal(Object.keys(uppy.plugins).length, 1, 'should add a plugin to the plugins stack')
  t.end()
})

test('noDuplicates', function (t) {
  const uppyTwoAcquirers = new Core()

  uppyTwoAcquirers.use(Acquirer1Plugin)
  const fn = uppyTwoAcquirers.use.bind(uppyTwoAcquirers, Acquirer1Plugin)

  t.throws(fn, new RegExp('Uppy is currently limited to running one of every plugin'))
  t.end()
})

// test('autoProceed', function (t) {
//   const uppyOneAcquirer = new Core()
//   uppyOneAcquirer
//     .use(Acquirer1Plugin)
//     .run()
//
//   const uppyTwoAcquirers = new Core()
//   uppyTwoAcquirers
//     .use(Acquirer1Plugin)
//     .use(Acquirer2Plugin)
//     .run()
//
//   t.equal(uppyOneAcquirer.opts.autoProceed, true, 'should autoProceed if only one acquirer is used')
//   t.equal(uppyTwoAcquirers.opts.autoProceed, false, 'should not autoProceed if more than one acquirer is used')
//   t.end()
// })
