'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('./Plugin');

module.exports = function (_Plugin) {
  _inherits(Redux, _Plugin);

  function Redux(core, opts) {
    _classCallCheck(this, Redux);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'state-sync';
    _this.id = 'Redux';
    _this.title = 'Redux Emitter';

    if (typeof opts.action === 'undefined') {
      throw new Error('action option is not defined');
    }
    if (typeof opts.dispatch === 'undefined') {
      throw new Error('dispatch option is not defined');
    }
    _this.opts = opts;

    _this.handleStateUpdate = _this.handleStateUpdate.bind(_this);
    return _this;
  }

  Redux.prototype.handleStateUpdate = function handleStateUpdate(prev, state, patch) {
    this.opts.dispatch(this.opts.action(prev, state, patch)); // this dispatches a redux event with the new state
  };

  Redux.prototype.install = function install() {
    this.core.emitter.on('core:state-update', this.handleStateUpdate);
    this.handleStateUpdate({}, this.core.state, this.core.state); // set the initial redux state
  };

  Redux.prototype.uninstall = function uninstall() {
    this.core.emitter.off('core:state-update', this.handleStateUpdate);
  };

  return Redux;
}(Plugin);
//# sourceMappingURL=Redux.js.map