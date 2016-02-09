var test = require('tape')
var Uppy = require('../src/core/index.js')

const TestPlugin = require('./mocks/test-plugin.js')
const uppy = new Uppy({debug: true})
uppy
  .use(TestPlugin, {target: '.UppyDragDrop-One'})
  .run()

test('core object', function (t) {
  const uppy = new Uppy()
  t.equal(typeof uppy, 'object', 'new Core() should return an object')
  t.end()
})

test('core type', function (t) {
  const uppy = new Uppy()
  t.equal(uppy.type, 'core', 'core.type should equal core')
  t.end()
})

test('run one plugin success', function (t) {
  const TestPlugin = require('./mocks/test-plugin.js')
  const uppy = new Uppy({debug: true})
  uppy
    .use(TestPlugin)
    .run()

  t.equal(uppy.then(result => result), [1, 2, 3])

  // setTimeout(function () {
  //   t.equal(uppy, [1, 2, 3])
  // }, 4000)

  t.end()
})
