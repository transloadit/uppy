'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var UppyCore = require('../core').Uppy;
var ProgressBarPlugin = require('../plugins/ProgressBar');

var h = React.createElement;

/**
 * React component that renders a progress bar at the top of the page.
 */

var ProgressBar = function (_React$Component) {
  _inherits(ProgressBar, _React$Component);

  function ProgressBar() {
    _classCallCheck(this, ProgressBar);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  ProgressBar.prototype.componentDidMount = function componentDidMount() {
    var uppy = this.props.uppy;
    var options = _extends({}, this.props, { target: this.container });
    delete options.uppy;

    uppy.use(ProgressBarPlugin, options);

    this.plugin = uppy.getPlugin('ProgressBar');
  };

  ProgressBar.prototype.componentWillUnmount = function componentWillUnmount() {
    var uppy = this.props.uppy;

    uppy.removePlugin(this.plugin);
  };

  ProgressBar.prototype.render = function render() {
    var _this2 = this;

    return h('div', {
      ref: function ref(container) {
        _this2.container = container;
      }
    });
  };

  return ProgressBar;
}(React.Component);

ProgressBar.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  fixed: PropTypes.bool
};
ProgressBar.defaultProps = {};

module.exports = ProgressBar;
//# sourceMappingURL=ProgressBar.js.map