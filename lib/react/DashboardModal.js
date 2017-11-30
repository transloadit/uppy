'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var UppyCore = require('../core/Core').Uppy;
var DashboardPlugin = require('../plugins/Dashboard');

var h = React.createElement;

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

var DashboardModal = function (_React$Component) {
  _inherits(DashboardModal, _React$Component);

  function DashboardModal() {
    _classCallCheck(this, DashboardModal);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  DashboardModal.prototype.componentDidMount = function componentDidMount() {
    var uppy = this.props.uppy;
    var options = _extends({}, this.props, {
      target: this.container,
      onRequestCloseModal: this.props.onRequestClose
    });
    delete options.uppy;
    uppy.use(DashboardPlugin, options);

    this.plugin = uppy.getPlugin('Dashboard');
    if (this.props.open) {
      this.plugin.openModal();
    }
  };

  DashboardModal.prototype.componentWillUnmount = function componentWillUnmount() {
    var uppy = this.props.uppy;

    uppy.removePlugin(this.plugin);
  };

  DashboardModal.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    if (this.props.open && !nextProps.open) {
      this.plugin.closeModal();
    } else if (!this.props.open && nextProps.open) {
      this.plugin.openModal();
    }
  };

  DashboardModal.prototype.render = function render() {
    var _this2 = this;

    return h('div', {
      ref: function ref(container) {
        _this2.container = container;
      }
    });
  };

  return DashboardModal;
}(React.Component);

DashboardModal.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  open: PropTypes.bool,
  onRequestClose: PropTypes.func,
  plugins: PropTypes.arrayOf(PropTypes.string),
  width: PropTypes.number,
  height: PropTypes.number,
  semiTransparent: PropTypes.bool,
  showProgressDetails: PropTypes.bool,
  hideUploadButton: PropTypes.bool,
  note: PropTypes.string,
  locale: PropTypes.object
};

DashboardModal.defaultProps = {};

module.exports = DashboardModal;
//# sourceMappingURL=DashboardModal.js.map