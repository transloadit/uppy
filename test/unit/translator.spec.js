import test from 'tape'
import Core from '../../src/core/index.js'
import russian from '../../src/locales/ru_RU.js'
import english from '../../src/locales/en_US.js'

test('translation', function (t) {
  const core = new Core({locale: russian})

  t.equal(
    core.translator.translate('chooseFile'),
    'Выберите файл',
    'should return translated string'
  )

  t.end()
})

test('interpolation', function (t) {
  const core = new Core({locale: english})

  t.equal(
    core.translator.translate('youHaveChosen', {'fileName': 'img.jpg'}),
    'You have chosen: img.jpg',
    'should return interpolated string'
  )

  t.end()
})

test('pluralization', function (t) {
  const core = new Core({locale: russian})

  t.equal(
    core.translator.translate('filesChosen', {'smart_count': '18'}),
    'Выбрано 18 файлов',
    'should return interpolated & pluralized string'
  )

  t.end()
})
