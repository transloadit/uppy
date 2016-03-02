var test = require('tape')
var Core = require('../src/core/index.js')
var DragDrop = require('../src/plugins/DragDrop.js')
var Tus10 = require('../src/plugins/Tus10.js')

test('uploadSomePizza', function (t) {
  const core = new Core()
  core
    .use(DragDrop, {target: '??'})
    .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
    .run()

  // trigger an upload with a fake blob
  // somehow test the resume? or just see if it's successful?
  // test the expected/actual results to pass/fail
})
