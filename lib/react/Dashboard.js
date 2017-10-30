'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var UppyCore = require('../core/Core');
var DashboardPlugin = require('../plugins/Dashboard');

var h = React.createElement;

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline, so you can put it anywhere you want.
 */

var Dashboard = function (_React$Component) {
  _inherits(Dashboard, _React$Component);

  function Dashboard() {
    _classCallCheck(this, Dashboard);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  Dashboard.prototype.componentDidMount = function componentDidMount() {
    var uppy = this.props.uppy;
    var options = _extends({}, this.props, { target: this.container });
    delete options.uppy;
    uppy.use(DashboardPlugin, options);

    this.plugin = uppy.getPlugin('Dashboard');
  };

  Dashboard.prototype.componentWillUnmount = function componentWillUnmount() {
    var uppy = this.props.uppy;

    uppy.removePlugin(this.plugin);
  };

  Dashboard.prototype.render = function render() {
    var _this2 = this;

    return h('div', {
      ref: function ref(container) {
        _this2.container = container;
      }
    });
  };

  return Dashboard;
}(React.Component);

Dashboard.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  plugins: PropTypes.arrayOf(PropTypes.string),
  inline: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  semiTransparent: PropTypes.bool,
  showProgressDetails: PropTypes.bool,
  hideUploadButton: PropTypes.bool,
  note: PropTypes.string,
  locale: PropTypes.object
};
Dashboard.defaultProps = {
  inline: true
};

module.exports = Dashboard;
//# sourceMappingURL=Dashboard.js.map