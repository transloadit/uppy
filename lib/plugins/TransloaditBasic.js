'use strict';

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _TransloaditPlugin2 = require('./TransloaditPlugin');

var _TransloaditPlugin3 = _interopRequireDefault(_TransloaditPlugin2);

var TransloaditBasic = (function (_TransloaditPlugin) {
  _inherits(TransloaditBasic, _TransloaditPlugin);

  function TransloaditBasic(core, opts) {
    _classCallCheck(this, TransloaditBasic);

    _get(Object.getPrototypeOf(TransloaditBasic.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'presetter';
    this.core.use(DragDrop, { modal: true, wait: true }).use(Tus10, { endpoint: 'http://master.tus.io:8080' });
  }

  return TransloaditBasic;
})(_TransloaditPlugin3['default']);