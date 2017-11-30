'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var UppyCore = require('../core').Uppy;

var h = React.createElement;

var UppyWrapper = function (_React$Component) {
  _inherits(UppyWrapper, _React$Component);

  function UppyWrapper(props) {
    _classCallCheck(this, UppyWrapper);

    var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

    _this.refContainer = _this.refContainer.bind(_this);
    return _this;
  }

  UppyWrapper.prototype.componentDidMount = function componentDidMount() {
    var plugin = this.props.uppy.getPlugin(this.props.plugin);

    plugin.mount(this.container, plugin);
  };

  UppyWrapper.prototype.componentWillUnmount = function componentWillUnmount() {
    var plugin = this.props.uppy.getPlugin(this.props.plugin);

    plugin.unmount();
  };

  UppyWrapper.prototype.refContainer = function refContainer(container) {
    this.container = container;
  };

  UppyWrapper.prototype.render = function render() {
    return h('div', { ref: this.refContainer });
  };

  return UppyWrapper;
}(React.Component);

UppyWrapper.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  plugin: PropTypes.string.isRequired
};

module.exports = UppyWrapper;
//# sourceMappingURL=Wrapper.js.map