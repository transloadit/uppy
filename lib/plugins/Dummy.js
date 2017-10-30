'use strict';

var _onload = require('on-load'),
    _appendChild = require('yo-yoify/lib/appendChild');

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('./Plugin');

// const yo = require('yo-yo')

/**
 * Dummy
 * A test plugin, does nothing useful
 */
module.exports = function (_Plugin) {
  _inherits(Dummy, _Plugin);

  function Dummy(core, opts) {
    var _h;

    _classCallCheck(this, Dummy);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'acquirer';
    _this.id = 'Dummy';
    _this.title = 'Mr. Plugin';

    // set default options
    var defaultOptions = {};

    // merge default options with the ones set by user
    _this.opts = _extends({}, defaultOptions, opts);

    _this.strange = (_h = document.createElement('h1'), _h.textContent = 'this is strange 1', _h);
    _this.render = _this.render.bind(_this);
    _this.install = _this.install.bind(_this);
    return _this;
  }

  Dummy.prototype.addFakeFileJustToTest = function addFakeFileJustToTest() {
    var blob = new Blob(['data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+CiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNTAiLz4KPC9zdmc+Cg=='], { type: 'image/svg+xml' });
    var file = {
      source: 'acceptance-test',
      name: 'test-file',
      type: 'image/svg+xml',
      data: blob
    };
    this.props.log('Adding fake file blob');
    this.props.addFile(file);
  };

  Dummy.prototype.render = function render(state) {
    var _h2, _uppyDummyFirstInput, _wowThisWorks;

    var bla = (_h2 = document.createElement('h2'), _h2.textContent = 'this is strange 2', _h2);
    return _wowThisWorks = document.createElement('div'), _wowThisWorks.setAttribute('class', 'wow-this-works'), _appendChild(_wowThisWorks, [' ', (_uppyDummyFirstInput = document.createElement('input'), _onload(_uppyDummyFirstInput, function (el) {
      el.focus();
    }, null, 2), _uppyDummyFirstInput.setAttribute('type', 'text'), _uppyDummyFirstInput.setAttribute('value', 'hello'), _uppyDummyFirstInput.setAttribute('class', 'UppyDummy-firstInput'), _uppyDummyFirstInput), ' ', this.strange, ' ', bla, ' ', state.dummy.text, ' ']), _wowThisWorks;
  };

  Dummy.prototype.install = function install() {
    var _this2 = this;

    this.core.setState({ dummy: { text: '123' } });

    var target = this.opts.target;
    var plugin = this;
    this.target = this.mount(target, plugin);

    setTimeout(function () {
      _this2.core.setState({ dummy: { text: '!!!' } });
    }, 2000);
  };

  return Dummy;
}(Plugin);

// module.exports = function (core, opts) {
//   if (!(this instanceof Dummy)) {
//     return new Dummy(core, opts)
//   }
// }
//# sourceMappingURL=Dummy.js.map