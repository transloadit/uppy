var test = require('tape');
var Core = require('../src/core/index.js');

test('core object', function (t) {
  const core = new Core();
  t.equal(typeof core, 'object', 'new Core() should return an object');
  t.end();
});

test('core type', function (t) {
  const core = new Core();
  t.equal(core.type, 'core', 'core.type should equal core');
  t.end();
});

test('translation', function (t) {
  const russianDict = require('../src/locale/ru_RU.json');
  const core = new Core({locale: russianDict});

  t.equal(core.translate('Choose a file'), 'Выберите файл', 'should return translated string');
  t.end();
});
