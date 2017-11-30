'use strict';

var _index = require('../../src/core/index.js');

var _index2 = _interopRequireDefault(_index);

var _ru_RU = require('../../src/locales/ru_RU.js');

var _ru_RU2 = _interopRequireDefault(_ru_RU);

var _en_US = require('../../src/locales/en_US.js');

var _en_US2 = _interopRequireDefault(_en_US);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('core/translator', function () {
  describe('translate', function () {
    it('should translate a string', function () {
      var core = new _index2.default({ locale: _ru_RU2.default });
      expect(core.translator.translate('chooseFile')).toEqual('Выберите файл');
    });
  });

  describe('interpolation', function () {
    it('should interpolate a string', function () {
      var core = new _index2.default({ locale: _en_US2.default });
      expect(core.translator.translate('youHaveChosen', { fileName: 'img.jpg' })).toEqual('You have chosen: img.jpg');
    });
  });

  describe('pluralization', function () {
    it('should translate a string', function () {
      var core = new _index2.default({ locale: _ru_RU2.default });
      expect(core.translator.translate('filesChosen', { smart_count: '18' })).toEqual('Выбрано 18 файлов');

      expect(core.translator.translate('filesChosen', { smart_count: '1' })).toEqual('Выбран 1 файл');

      expect(core.translator.translate('filesChosen', { smart_count: '0' })).toEqual('Выбрано 0 файлов');
    });
  });
});
//# sourceMappingURL=Translator.test.js.map