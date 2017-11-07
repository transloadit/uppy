'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('./Plugin');

/**
 * Add Redux DevTools support to Uppy
 *
 * See https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
 * and https://github.com/zalmoxisus/mobx-remotedev/blob/master/src/monitorActions.js
 */
module.exports = function (_Plugin) {
  _inherits(ReduxDevTools, _Plugin);

  function ReduxDevTools(core, opts) {
    _classCallCheck(this, ReduxDevTools);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'debugger';
    _this.id = 'ReduxDevTools';
    _this.title = 'Redux DevTools';

    // set default options
    var defaultOptions = {};

    // merge default options with the ones set by user
    _this.opts = _extends({}, defaultOptions, opts);

    _this.handleStateChange = _this.handleStateChange.bind(_this);
    _this.initDevTools = _this.initDevTools.bind(_this);
    return _this;
  }

  ReduxDevTools.prototype.handleStateChange = function handleStateChange(prevState, nextState, patch) {
    this.devTools.send('UPPY_STATE_UPDATE', nextState);
  };

  ReduxDevTools.prototype.initDevTools = function initDevTools() {
    var _this2 = this;

    this.devTools = window.devToolsExtension.connect();
    this.devToolsUnsubscribe = this.devTools.subscribe(function (message) {
      if (message.type === 'DISPATCH') {
        console.log(message.payload.type);

        // Implement monitors actions
        switch (message.payload.type) {
          case 'RESET':
            _this2.core.reset();
            return;
          case 'IMPORT_STATE':
            var computedStates = message.payload.nextLiftedState.computedStates;
            _this2.core.state = _extends({}, _this2.core.state, computedStates[computedStates.length - 1].state);
            _this2.core.updateAll(_this2.core.state);
            return;
          case 'JUMP_TO_STATE':
          case 'JUMP_TO_ACTION':
            // this.setState(state)
            _this2.core.state = _extends({}, _this2.core.state, JSON.parse(message.state));
            _this2.core.updateAll(_this2.core.state);
        }
      }
    });
  };

  ReduxDevTools.prototype.install = function install() {
    this.withDevTools = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__;
    if (this.withDevTools) {
      this.initDevTools();
      this.core.on('core:state-update', this.handleStateChange);
    }
  };

  ReduxDevTools.prototype.uninstall = function uninstall() {
    if (this.withDevTools) {
      this.core.emitter.off('core:state-update', this.handleStateUpdate);
    }
  };

  return ReduxDevTools;
}(Plugin);
//# sourceMappingURL=ReduxDevTools.js.map