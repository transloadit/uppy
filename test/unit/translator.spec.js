var test = require('tape')
var Core = require('../../src/core/index.js')

test('translation', function (t) {
  const russian = require('../../src/locales/ru_RU.js')
  const core = new Core({locales: russian})

  t.equal(
    core.translator.translate('chooseFile'),
    'Выберите файл',
    'should return translated string'
  )

  t.end()
})

test('interpolation', function (t) {
  const english = require('../../src/locales/en_US.js')
  const core = new Core({locales: english})

  t.equal(
    core.translator.translate('youHaveChosen', {'fileName': 'img.jpg'}),
    'You have chosen: img.jpg',
    'should return interpolated string'
  )

  t.end()
})

test('pluralization', function (t) {
  const russian = require('../../src/locales/ru_RU.js')
  const core = new Core({locales: russian})

  t.equal(
    core.translator.translate('filesChosen', {'smart_count': '18'}),
    'Выбрано 18 файлов',
    'should return interpolated & pluralized string'
  )

  t.end()
})
