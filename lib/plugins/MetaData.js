'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('./Plugin');

/**
 * Meta Data
 * Adds metadata fields to Uppy
 *
 */
module.exports = function (_Plugin) {
  _inherits(MetaData, _Plugin);

  function MetaData(core, opts) {
    _classCallCheck(this, MetaData);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'modifier';
    _this.id = 'MetaData';
    _this.title = 'Meta Data';

    // set default options
    var defaultOptions = {};

    // merge default options with the ones set by user
    _this.opts = _extends({}, defaultOptions, opts);

    _this.handleFileAdded = _this.handleFileAdded.bind(_this);
    return _this;
  }

  MetaData.prototype.handleFileAdded = function handleFileAdded(file) {
    var _this2 = this;

    var metaFields = this.opts.fields;

    metaFields.forEach(function (item) {
      var obj = {};
      obj[item.id] = item.value;
      _this2.core.updateMeta(obj, file.id);
    });
  };

  MetaData.prototype.addInitialMeta = function addInitialMeta() {
    var metaFields = this.opts.fields;

    this.core.setState({
      metaFields: metaFields
    });

    this.core.on('core:file-added', this.handleFileAdded);
  };

  MetaData.prototype.install = function install() {
    this.addInitialMeta();
  };

  MetaData.prototype.uninstall = function uninstall() {
    this.core.off('core:file-added', this.handleFileAdded);
  };

  return MetaData;
}(Plugin);
//# sourceMappingURL=MetaData.js.map