'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('../Plugin');
var Translator = require('../../core/Translator');
var dragDrop = require('drag-drop');
var Dashboard = require('./Dashboard');
var StatusBar = require('../StatusBar');
var Informer = require('../Informer');

var _require = require('../../core/Utils'),
    findAllDOMElements = _require.findAllDOMElements;

var prettyBytes = require('prettier-bytes');

var _require2 = require('./icons'),
    defaultTabIcon = _require2.defaultTabIcon;

/**
 * Modal Dialog & Dashboard
 */


module.exports = function (_Plugin) {
  _inherits(DashboardUI, _Plugin);

  function DashboardUI(core, opts) {
    _classCallCheck(this, DashboardUI);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.id = 'Dashboard';
    _this.title = 'Dashboard';
    _this.type = 'orchestrator';

    var defaultLocale = {
      strings: {
        selectToUpload: 'Select files to upload',
        closeModal: 'Close Modal',
        upload: 'Upload',
        importFrom: 'Import files from',
        dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
        dashboardTitle: 'Uppy Dashboard',
        copyLinkToClipboardSuccess: 'Link copied to clipboard.',
        copyLinkToClipboardFallback: 'Copy the URL below',
        fileSource: 'File source',
        done: 'Done',
        localDisk: 'Local Disk',
        myDevice: 'My Device',
        dropPasteImport: 'Drop files here, paste, import from one of the locations above or',
        dropPaste: 'Drop files here, paste or',
        browse: 'browse',
        fileProgress: 'File progress: upload speed and ETA',
        numberOfSelectedFiles: 'Number of selected files',
        uploadAllNewFiles: 'Upload all new files'
      }

      // set default options
    };var defaultOptions = {
      target: 'body',
      getMetaFromForm: true,
      trigger: '#uppy-select-files',
      inline: false,
      width: 750,
      height: 550,
      semiTransparent: false,
      defaultTabIcon: defaultTabIcon(),
      showProgressDetails: false,
      hideUploadButton: false,
      note: null,
      closeModalOnClickOutside: false,
      locale: defaultLocale,
      onRequestCloseModal: function onRequestCloseModal() {
        return _this.closeModal();
      }

      // merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOptions, opts);

    _this.locale = _extends({}, defaultLocale, _this.opts.locale);
    _this.locale.strings = _extends({}, defaultLocale.strings, _this.opts.locale.strings);

    _this.translator = new Translator({ locale: _this.locale });
    _this.containerWidth = _this.translator.translate.bind(_this.translator);

    _this.closeModal = _this.closeModal.bind(_this);
    _this.requestCloseModal = _this.requestCloseModal.bind(_this);
    _this.openModal = _this.openModal.bind(_this);
    _this.isModalOpen = _this.isModalOpen.bind(_this);

    _this.addTarget = _this.addTarget.bind(_this);
    _this.actions = _this.actions.bind(_this);
    _this.hideAllPanels = _this.hideAllPanels.bind(_this);
    _this.showPanel = _this.showPanel.bind(_this);
    _this.initEvents = _this.initEvents.bind(_this);
    _this.handleEscapeKeyPress = _this.handleEscapeKeyPress.bind(_this);
    _this.handleClickOutside = _this.handleClickOutside.bind(_this);
    _this.handleFileCard = _this.handleFileCard.bind(_this);
    _this.handleDrop = _this.handleDrop.bind(_this);
    _this.pauseAll = _this.pauseAll.bind(_this);
    _this.resumeAll = _this.resumeAll.bind(_this);
    _this.cancelAll = _this.cancelAll.bind(_this);
    _this.updateDashboardElWidth = _this.updateDashboardElWidth.bind(_this);
    _this.render = _this.render.bind(_this);
    _this.install = _this.install.bind(_this);
    return _this;
  }

  DashboardUI.prototype.addTarget = function addTarget(plugin) {
    var callerPluginId = plugin.id || plugin.constructor.name;
    var callerPluginName = plugin.title || callerPluginId;
    // const callerPluginIcon = plugin.icon || this.opts.defaultTabIcon
    var callerPluginType = plugin.type;

    if (callerPluginType !== 'acquirer' && callerPluginType !== 'progressindicator' && callerPluginType !== 'presenter') {
      var msg = 'Dashboard: Modal can only be used by plugins of types: acquirer, progressindicator, presenter';
      this.core.log(msg);
      return;
    }

    var target = {
      id: callerPluginId,
      name: callerPluginName,
      // icon: callerPluginIcon,
      type: callerPluginType,
      // render: plugin.render,
      isHidden: true
    };

    var state = this.getPluginState();
    var newTargets = state.targets.slice();
    newTargets.push(target);

    this.setPluginState({
      targets: newTargets
    });

    return this.target;
  };

  DashboardUI.prototype.hideAllPanels = function hideAllPanels() {
    this.setPluginState({
      activePanel: false
    });
  };

  DashboardUI.prototype.showPanel = function showPanel(id) {
    var _getPluginState = this.getPluginState(),
        targets = _getPluginState.targets;

    var activePanel = targets.filter(function (target) {
      return target.type === 'acquirer' && target.id === id;
    })[0];

    this.setPluginState({
      activePanel: activePanel
    });
  };

  DashboardUI.prototype.requestCloseModal = function requestCloseModal() {
    if (this.opts.onRequestCloseModal) {
      return this.opts.onRequestCloseModal();
    } else {
      this.closeModal();
    }
  };

  DashboardUI.prototype.openModal = function openModal() {
    this.setPluginState({
      isHidden: false
    });

    // save scroll position
    this.savedDocumentScrollPosition = window.scrollY;

    // add class to body that sets position fixed, move everything back
    // to scroll position
    document.body.classList.add('is-UppyDashboard-open');
    document.body.style.top = '-' + this.savedDocumentScrollPosition + 'px';

    // focus on modal inner block
    this.target.querySelector('.UppyDashboard-inner').focus();

    // this.updateDashboardElWidth()
    // to be sure, sometimes when the function runs, container size is still 0
    setTimeout(this.updateDashboardElWidth, 500);
  };

  DashboardUI.prototype.closeModal = function closeModal() {
    this.setPluginState({
      isHidden: true
    });

    document.body.classList.remove('is-UppyDashboard-open');

    window.scrollTo(0, this.savedDocumentScrollPosition);
  };

  DashboardUI.prototype.isModalOpen = function isModalOpen() {
    return !this.getPluginState().isHidden || false;
  };

  // Close the Modal on esc key press


  DashboardUI.prototype.handleEscapeKeyPress = function handleEscapeKeyPress(event) {
    if (event.keyCode === 27) {
      this.requestCloseModal();
    }
  };

  DashboardUI.prototype.handleClickOutside = function handleClickOutside() {
    if (this.opts.closeModalOnClickOutside) this.requestCloseModal();
  };

  DashboardUI.prototype.initEvents = function initEvents() {
    var _this2 = this;

    // Modal open button
    var showModalTrigger = findAllDOMElements(this.opts.trigger);
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(function (trigger) {
        return trigger.addEventListener('click', _this2.openModal);
      });
    }

    if (!this.opts.inline && !showModalTrigger) {
      this.core.log('Dashboard modal trigger not found, you won’t be able to select files. Make sure `trigger` is set correctly in Dashboard options', 'error');
    }

    document.body.addEventListener('keyup', this.handleEscapeKeyPress);

    // Drag Drop
    this.removeDragDropListener = dragDrop(this.el, function (files) {
      _this2.handleDrop(files);
    });
  };

  DashboardUI.prototype.removeEvents = function removeEvents() {
    var _this3 = this;

    var showModalTrigger = findAllDOMElements(this.opts.trigger);
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(function (trigger) {
        return trigger.removeEventListener('click', _this3.openModal);
      });
    }

    this.removeDragDropListener();
    document.body.removeEventListener('keyup', this.handleEscapeKeyPress);
  };

  DashboardUI.prototype.actions = function actions() {
    this.core.on('core:file-added', this.hideAllPanels);
    this.core.on('dashboard:file-card', this.handleFileCard);

    window.addEventListener('resize', this.updateDashboardElWidth);
  };

  DashboardUI.prototype.removeActions = function removeActions() {
    window.removeEventListener('resize', this.updateDashboardElWidth);

    this.core.off('core:file-added', this.hideAllPanels);
    this.core.off('dashboard:file-card', this.handleFileCard);
  };

  DashboardUI.prototype.updateDashboardElWidth = function updateDashboardElWidth() {
    var dashboardEl = this.target.querySelector('.UppyDashboard-inner');
    this.core.log('Dashboard width: ' + dashboardEl.offsetWidth);

    this.setPluginState({
      containerWidth: dashboardEl.offsetWidth
    });
  };

  DashboardUI.prototype.handleFileCard = function handleFileCard(fileId) {
    this.setPluginState({
      fileCardFor: fileId || false
    });
  };

  DashboardUI.prototype.handleDrop = function handleDrop(files) {
    var _this4 = this;

    this.core.log('[Dashboard] Files were dropped');

    files.forEach(function (file) {
      _this4.core.addFile({
        source: _this4.id,
        name: file.name,
        type: file.type,
        data: file
      });
    });
  };

  DashboardUI.prototype.cancelAll = function cancelAll() {
    this.core.emit('core:cancel-all');
  };

  DashboardUI.prototype.pauseAll = function pauseAll() {
    this.core.emit('core:pause-all');
  };

  DashboardUI.prototype.resumeAll = function resumeAll() {
    this.core.emit('core:resume-all');
  };

  DashboardUI.prototype.render = function render(state) {
    var _this5 = this;

    var pluginState = this.getPluginState();
    var files = state.files;

    var newFiles = Object.keys(files).filter(function (file) {
      return !files[file].progress.uploadStarted;
    });
    var inProgressFiles = Object.keys(files).filter(function (file) {
      return !files[file].progress.uploadComplete && files[file].progress.uploadStarted && !files[file].isPaused;
    });

    var inProgressFilesArray = [];
    inProgressFiles.forEach(function (file) {
      inProgressFilesArray.push(files[file]);
    });

    var totalSize = 0;
    var totalUploadedSize = 0;
    inProgressFilesArray.forEach(function (file) {
      totalSize = totalSize + (file.progress.bytesTotal || 0);
      totalUploadedSize = totalUploadedSize + (file.progress.bytesUploaded || 0);
    });
    totalSize = prettyBytes(totalSize);
    totalUploadedSize = prettyBytes(totalUploadedSize);

    var acquirers = pluginState.targets.filter(function (target) {
      var plugin = _this5.core.getPlugin(target.id);
      target.icon = plugin.icon || _this5.opts.defaultTabIcon;
      target.render = plugin.render;
      return target.type === 'acquirer';
    });

    var progressindicators = pluginState.targets.filter(function (target) {
      var plugin = _this5.core.getPlugin(target.id);
      target.icon = plugin.icon || _this5.opts.defaultTabIcon;
      target.render = plugin.render;
      return target.type === 'progressindicator';
    });

    var startUpload = function startUpload(ev) {
      _this5.core.upload().catch(function (err) {
        // Log error.
        _this5.core.log(err.stack || err.message || err);
      });
    };

    var cancelUpload = function cancelUpload(fileID) {
      _this5.core.emit('core:upload-cancel', fileID);
      _this5.core.emit('core:file-remove', fileID);
    };

    var showFileCard = function showFileCard(fileID) {
      _this5.core.emit('dashboard:file-card', fileID);
    };

    var fileCardDone = function fileCardDone(meta, fileID) {
      _this5.core.emit('core:update-meta', meta, fileID);
      _this5.core.emit('dashboard:file-card');
    };

    return Dashboard({
      state: state,
      modal: pluginState,
      newFiles: newFiles,
      files: files,
      totalFileCount: Object.keys(files).length,
      totalProgress: state.totalProgress,
      acquirers: acquirers,
      activePanel: pluginState.activePanel,
      getPlugin: this.core.getPlugin,
      progressindicators: progressindicators,
      autoProceed: this.core.opts.autoProceed,
      hideUploadButton: this.opts.hideUploadButton,
      id: this.id,
      closeModal: this.requestCloseModal,
      handleClickOutside: this.handleClickOutside,
      showProgressDetails: this.opts.showProgressDetails,
      inline: this.opts.inline,
      semiTransparent: this.opts.semiTransparent,
      showPanel: this.showPanel,
      hideAllPanels: this.hideAllPanels,
      log: this.core.log,
      i18n: this.containerWidth,
      pauseAll: this.pauseAll,
      resumeAll: this.resumeAll,
      addFile: this.core.addFile,
      removeFile: this.core.removeFile,
      info: this.core.info,
      note: this.opts.note,
      metaFields: state.metaFields,
      resumableUploads: this.core.state.capabilities.resumableUploads || false,
      startUpload: startUpload,
      pauseUpload: this.core.pauseResume,
      retryUpload: this.core.retryUpload,
      cancelUpload: cancelUpload,
      fileCardFor: pluginState.fileCardFor,
      showFileCard: showFileCard,
      fileCardDone: fileCardDone,
      updateDashboardElWidth: this.updateDashboardElWidth,
      maxWidth: this.opts.maxWidth,
      maxHeight: this.opts.maxHeight,
      currentWidth: pluginState.containerWidth,
      isWide: pluginState.containerWidth > 400
    });
  };

  DashboardUI.prototype.discoverProviderPlugins = function discoverProviderPlugins() {
    var _this6 = this;

    this.core.iteratePlugins(function (plugin) {
      if (plugin && !plugin.target && plugin.opts && plugin.opts.target === _this6.constructor) {
        _this6.addTarget(plugin);
      }
    });
  };

  DashboardUI.prototype.install = function install() {
    var _this7 = this;

    // Set default state for Modal
    this.setPluginState({
      isHidden: true,
      showFileCard: false,
      activePanel: false,
      targets: []
    });

    var target = this.opts.target;

    if (target) {
      this.mount(target, this);
    }

    var plugins = this.opts.plugins || [];
    plugins.forEach(function (pluginID) {
      var plugin = _this7.core.getPlugin(pluginID);
      if (plugin) plugin.mount(_this7, plugin);
    });

    if (!this.opts.disableStatusBar) {
      this.core.use(StatusBar, {
        target: this
      });
    }

    if (!this.opts.disableInformer) {
      this.core.use(Informer, {
        target: this
      });
    }

    this.discoverProviderPlugins();

    this.initEvents();
    this.actions();
  };

  DashboardUI.prototype.uninstall = function uninstall() {
    var _this8 = this;

    if (!this.opts.disableInformer) {
      var informer = this.core.getPlugin('Informer');
      if (informer) this.core.removePlugin(informer);
    }

    if (!this.opts.disableStatusBar) {
      var statusBar = this.core.getPlugin('StatusBar');
      // Checking if this plugin exists, in case it was removed by uppy-core
      // before the Dashboard was.
      if (statusBar) this.core.removePlugin(statusBar);
    }

    var plugins = this.opts.plugins || [];
    plugins.forEach(function (pluginID) {
      var plugin = _this8.core.getPlugin(pluginID);
      if (plugin) plugin.unmount();
    });

    this.unmount();
    this.removeActions();
    this.removeEvents();
  };

  return DashboardUI;
}(Plugin);
//# sourceMappingURL=index.js.map