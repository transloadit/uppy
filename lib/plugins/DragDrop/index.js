'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _svgNamespace = 'http://www.w3.org/2000/svg',
    _appendChild = require('yo-yoify/lib/appendChild');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('./../Plugin');
var Translator = require('../../core/Translator');

var _require = require('../../core/Utils'),
    toArray = _require.toArray;

var dragDrop = require('drag-drop');


/**
 * Drag & Drop plugin
 *
 */
module.exports = function (_Plugin) {
  _inherits(DragDrop, _Plugin);

  function DragDrop(core, opts) {
    var _path, _path2, _path3, _uppyIcon;

    _classCallCheck(this, DragDrop);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'acquirer';
    _this.id = 'DragDrop';
    _this.title = 'Drag & Drop';
    _this.icon = (_uppyIcon = document.createElementNS(_svgNamespace, 'svg'), _uppyIcon.setAttribute('aria-hidden', 'true'), _uppyIcon.setAttribute('width', '28'), _uppyIcon.setAttribute('height', '28'), _uppyIcon.setAttribute('viewBox', '0 0 16 16'), _uppyIcon.setAttribute('class', 'UppyIcon'), _appendChild(_uppyIcon, [' ', (_path = document.createElementNS(_svgNamespace, 'path'), _path.setAttribute('d', 'M15.982 2.97c0-.02 0-.02-.018-.037 0-.017-.017-.035-.035-.053 0 0 0-.018-.02-.018-.017-.018-.034-.053-.052-.07L13.19.123c-.017-.017-.034-.035-.07-.053h-.018c-.018-.017-.035-.017-.053-.034h-.02c-.017 0-.034-.018-.052-.018h-6.31a.415.415 0 0 0-.446.426V11.11c0 .25.196.446.445.446h8.89A.44.44 0 0 0 16 11.11V3.023c-.018-.018-.018-.035-.018-.053zm-2.65-1.46l1.157 1.157h-1.157V1.51zm1.78 9.157h-8V.89h5.332v2.22c0 .25.196.446.445.446h2.22v7.11z'), _path), ' ', (_path2 = document.createElementNS(_svgNamespace, 'path'), _path2.setAttribute('d', 'M9.778 12.89H4V2.666a.44.44 0 0 0-.444-.445.44.44 0 0 0-.445.445v10.666c0 .25.197.445.446.445h6.222a.44.44 0 0 0 .444-.445.44.44 0 0 0-.444-.444z'), _path2), ' ', (_path3 = document.createElementNS(_svgNamespace, 'path'), _path3.setAttribute('d', 'M.444 16h6.223a.44.44 0 0 0 .444-.444.44.44 0 0 0-.443-.445H.89V4.89a.44.44 0 0 0-.446-.446A.44.44 0 0 0 0 4.89v10.666c0 .248.196.444.444.444z'), _path3), ' ']), _uppyIcon);

    var defaultLocale = {
      strings: {
        dropHereOr: 'Drop files here or',
        browse: 'browse'
        // selectedFiles: {
        //   0: '%{smart_count} file selected',
        //   1: '%{smart_count} files selected'
        // }
      }

      // Default options
    };var defaultOpts = {
      target: null,
      getMetaFromForm: true,
      width: '100%',
      height: '100%',
      note: '',
      locale: defaultLocale

      // Merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOpts, opts);

    // Check for browser dragDrop support
    _this.isDragDropSupported = _this.checkDragDropSupport();

    _this.locale = _extends({}, defaultLocale, _this.opts.locale);
    _this.locale.strings = _extends({}, defaultLocale.strings, _this.opts.locale.strings);

    // i18n
    _this.translator = new Translator({ locale: _this.locale });
    _this.i18n = _this.translator.translate.bind(_this.translator);

    // Bind `this` to class methods
    _this.handleDrop = _this.handleDrop.bind(_this);
    _this.checkDragDropSupport = _this.checkDragDropSupport.bind(_this);
    _this.handleInputChange = _this.handleInputChange.bind(_this);
    _this.render = _this.render.bind(_this);
    return _this;
  }

  /**
   * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
   * @return {Boolean} true if supported, false otherwise
   */


  DragDrop.prototype.checkDragDropSupport = function checkDragDropSupport() {
    var div = document.createElement('div');

    if (!('draggable' in div) || !('ondragstart' in div && 'ondrop' in div)) {
      return false;
    }

    if (!('FormData' in window)) {
      return false;
    }

    if (!('FileReader' in window)) {
      return false;
    }

    return true;
  };

  DragDrop.prototype.handleDrop = function handleDrop(files) {
    var _this2 = this;

    this.core.log('[DragDrop] Files dropped');

    files.forEach(function (file) {
      _this2.core.addFile({
        source: _this2.id,
        name: file.name,
        type: file.type,
        data: file
      });
    });
  };

  DragDrop.prototype.handleInputChange = function handleInputChange(ev) {
    var _this3 = this;

    this.core.log('[DragDrop] Files selected through input');

    var files = toArray(ev.target.files);

    files.forEach(function (file) {
      _this3.core.addFile({
        source: _this3.id,
        name: file.name,
        type: file.type,
        data: file
      });
    });
  };

  DragDrop.prototype.render = function render(state) {
    var _this4 = this,
        _path4,
        _uppyIcon2,
        _uppyDragDropInput,
        _uppyDragDropDragText,
        _uppyDragDropLabel,
        _uppyDragDropNote,
        _uppyDragDropInner,
        _div;

    var onSelect = function onSelect(ev) {
      var input = _this4.target.querySelector('.uppy-DragDrop-input');
      input.click();
    };

    // const selectedFilesCount = Object.keys(state.files).length

    return _div = document.createElement('div'), _div.setAttribute('style', 'width: ' + String(this.opts.width) + '; height: ' + String(this.opts.height) + ';'), _div.setAttribute('class', 'Uppy UppyTheme--default uppy-DragDrop-container ' + String(this.isDragDropSupported ? 'is-dragdrop-supported' : '') + ''), _appendChild(_div, [' ', (_uppyDragDropInner = document.createElement('form'), _uppyDragDropInner.onsubmit = function (ev) {
      return ev.preventDefault();
    }, _uppyDragDropInner.setAttribute('class', 'uppy-DragDrop-inner'), _appendChild(_uppyDragDropInner, [' ', (_uppyIcon2 = document.createElementNS(_svgNamespace, 'svg'), _uppyIcon2.setAttribute('aria-hidden', 'true'), _uppyIcon2.setAttribute('width', '16'), _uppyIcon2.setAttribute('height', '16'), _uppyIcon2.setAttribute('viewBox', '0 0 16 16'), _uppyIcon2.setAttribute('xmlns', 'http://www.w3.org/2000/svg'), _uppyIcon2.setAttribute('class', 'UppyIcon uppy-DragDrop-arrow'), _appendChild(_uppyIcon2, [' ', (_path4 = document.createElementNS(_svgNamespace, 'path'), _path4.setAttribute('d', 'M11 10V0H5v10H2l6 6 6-6h-3zm0 0'), _path4.setAttribute('fill-rule', 'evenodd'), _path4), ' ']), _uppyIcon2), ' ', (_uppyDragDropInput = document.createElement('input'), _uppyDragDropInput.setAttribute('type', 'file'), _uppyDragDropInput.setAttribute('name', 'files[]'), 'true' && _uppyDragDropInput.setAttribute('multiple', 'multiple'), _uppyDragDropInput.setAttribute('value', ''), _uppyDragDropInput.onchange = this.handleInputChange.bind(this), _uppyDragDropInput.setAttribute('class', 'uppy-DragDrop-input uppy-DragDrop-focus'), _uppyDragDropInput), ' ', (_uppyDragDropLabel = document.createElement('label'), _uppyDragDropLabel.onclick = onSelect, _uppyDragDropLabel.setAttribute('class', 'uppy-DragDrop-label'), _appendChild(_uppyDragDropLabel, [' ', this.i18n('dropHereOr'), ' ', (_uppyDragDropDragText = document.createElement('span'), _uppyDragDropDragText.setAttribute('class', 'uppy-DragDrop-dragText'), _appendChild(_uppyDragDropDragText, [this.i18n('browse')]), _uppyDragDropDragText), ' ']), _uppyDragDropLabel), ' ', (_uppyDragDropNote = document.createElement('span'), _uppyDragDropNote.setAttribute('class', 'uppy-DragDrop-note'), _appendChild(_uppyDragDropNote, [this.opts.note]), _uppyDragDropNote), ' ']), _uppyDragDropInner), ' ']), _div;
  };

  // ${selectedFilesCount > 0
  // ? html`<div class="uppy-DragDrop-selectedCount">
  //     ${this.i18n('selectedFiles', {'smart_count': selectedFilesCount})}
  //   </div>`
  // : ''}

  DragDrop.prototype.install = function install() {
    var target = this.opts.target;
    var plugin = this;
    if (target) {
      this.mount(target, plugin);
    }
  };

  DragDrop.prototype.uninstall = function uninstall() {
    this.unmount();
  };

  DragDrop.prototype.mount = function mount() {
    var _Plugin$prototype$mou,
        _this5 = this;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    (_Plugin$prototype$mou = _Plugin.prototype.mount).call.apply(_Plugin$prototype$mou, [this].concat(args));

    var dndContainer = this.target.querySelector('.uppy-DragDrop-container');
    this.removeDragDropListener = dragDrop(dndContainer, function (files) {
      _this5.handleDrop(files);
      _this5.core.log(files);
    });
  };

  DragDrop.prototype.unmount = function unmount() {
    var _Plugin$prototype$unm;

    this.removeDragDropListener();

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    (_Plugin$prototype$unm = _Plugin.prototype.unmount).call.apply(_Plugin$prototype$unm, [this].concat(args));
  };

  return DragDrop;
}(Plugin);
//# sourceMappingURL=index.js.map