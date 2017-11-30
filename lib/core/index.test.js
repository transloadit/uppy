'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('core/index', function () {
  it('should expose the uppy core as the default export', function () {
    expect(typeof _index2.default === 'undefined' ? 'undefined' : _typeof(_index2.default)).toEqual('function');
    var core = new _index2.default({});
    expect(typeof core === 'undefined' ? 'undefined' : _typeof(core)).toEqual('object');
    expect(core.constructor.name).toEqual('Uppy');
  });
});
//# sourceMappingURL=index.test.js.map