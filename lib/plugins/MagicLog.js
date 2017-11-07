'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('./Plugin');
// import deepDiff from 'deep-diff'

/**
 * Magic Log
 * Helps debug Uppy
 * inspired by https://github.com/yoshuawuyts/choo-log
 *
 */
module.exports = function (_Plugin) {
  _inherits(MagicLog, _Plugin);

  function MagicLog(core, opts) {
    _classCallCheck(this, MagicLog);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'debugger';
    _this.id = 'MagicLog';
    _this.title = 'Magic Log';

    // set default options
    var defaultOptions = {};

    // merge default options with the ones set by user
    _this.opts = _extends({}, defaultOptions, opts);

    _this.handleStateUpdate = _this.handleStateUpdate.bind(_this);
    return _this;
  }

  MagicLog.prototype.handleStateUpdate = function handleStateUpdate(prev, state, patch) {
    console.group('State');
    console.log('Prev', prev);
    console.log('Next', state);
    console.log('Patch', patch);
    console.groupEnd();
  };

  MagicLog.prototype.install = function install() {
    var uppy = this.core.emitter;
    uppy.on('state-update', this.handleStateUpdate);
  };

  MagicLog.prototype.uninstall = function uninstall() {
    this.core.emitter.off('state-update', this.handleStateUpdate);
  };

  return MagicLog;
}(Plugin);
//# sourceMappingURL=MagicLog.js.map