var test = require('tape');
var Core = require('../src/core/index.js');

const core = new Core();

test('core object', function (t) {
  t.equal(typeof core, 'object', 'new Core() should return an object');
  t.end();
});

test('core type', function (t) {
  t.equal(core.type, 'core', 'core.type should equal core');
  t.end();
});
