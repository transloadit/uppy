'use strict';

var _appendChild = require('yo-yoify/lib/appendChild'),
    _onload = require('on-load');

var FileList = require('./FileList');
var Tabs = require('./Tabs');
var FileCard = require('./FileCard');
var UploadBtn = require('./UploadBtn');

var _require = require('../../core/Utils'),
    isTouchDevice = _require.isTouchDevice,
    toArray = _require.toArray;

var _require2 = require('./icons'),
    closeIcon = _require2.closeIcon;

// http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog
// https://github.com/ghosh/micromodal

module.exports = function Dashboard(props) {
  var _uppyDashboardOverlay, _uppyDashboardClose, _uppyDashboardActions, _uppyDashboardFilesContainer, _uppyDashboardContentPanel, _uppyDashboardProgressindicators, _uppyDashboardInnerWrap, _uppyDashboardInner, _div2;

  function handleInputChange(ev) {
    ev.preventDefault();
    var files = toArray(ev.target.files);

    files.forEach(function (file) {
      props.addFile({
        source: props.id,
        name: file.name,
        type: file.type,
        data: file
      });
    });
  }

  // @TODO Exprimental, work in progress
  // no names, weird API, Chrome-only http://stackoverflow.com/a/22940020
  function handlePaste(ev) {
    ev.preventDefault();

    var files = toArray(ev.clipboardData.items);
    files.forEach(function (file) {
      if (file.kind !== 'file') return;

      var blob = file.getAsFile();
      if (!blob) {
        props.log('[Dashboard] File pasted, but the file blob is empty');
        props.info('Error pasting file', 'error');
        return;
      }
      props.log('[Dashboard] File pasted');
      props.addFile({
        source: props.id,
        name: file.name,
        type: file.type,
        data: blob
      });
    });
  }

  var renderInnerPanel = function renderInnerPanel(props) {
    var _uppyDashboardContentTitle, _uppyDashboardContentBack, _uppyDashboardContentBar, _div;

    return _div = document.createElement('div'), _div.setAttribute('style', 'width: 100%; height: 100%;'), _appendChild(_div, [' ', (_uppyDashboardContentBar = document.createElement('div'), _uppyDashboardContentBar.setAttribute('class', 'UppyDashboardContent-bar'), _appendChild(_uppyDashboardContentBar, [' ', (_uppyDashboardContentTitle = document.createElement('h2'), _uppyDashboardContentTitle.setAttribute('class', 'UppyDashboardContent-title'), _appendChild(_uppyDashboardContentTitle, [' ', props.i18n('importFrom'), ' ', props.activePanel ? props.activePanel.name : null, ' ']), _uppyDashboardContentTitle), ' ', (_uppyDashboardContentBack = document.createElement('button'), _uppyDashboardContentBack.setAttribute('type', 'button'), _uppyDashboardContentBack.onclick = props.hideAllPanels, _uppyDashboardContentBack.setAttribute('class', 'UppyDashboardContent-back'), _appendChild(_uppyDashboardContentBack, [props.i18n('done')]), _uppyDashboardContentBack), ' ']), _uppyDashboardContentBar), ' ', props.getPlugin(props.activePanel.id).render(props.state), ' ']), _div;
  };

  return _div2 = document.createElement('div'), _div2.setAttribute('aria-hidden', '' + String(props.inline ? 'false' : props.modal.isHidden) + ''), _div2.setAttribute('aria-label', '' + String(!props.inline ? props.i18n('dashboardWindowTitle') : props.i18n('dashboardTitle')) + ''), _div2.onpaste = handlePaste, _div2.setAttribute('class', 'Uppy UppyTheme--default UppyDashboard\n                          ' + String(isTouchDevice() ? 'Uppy--isTouchDevice' : '') + '\n                          ' + String(props.semiTransparent ? 'UppyDashboard--semiTransparent' : '') + '\n                          ' + String(!props.inline ? 'UppyDashboard--modal' : '') + '\n                          ' + String(props.isWide ? 'UppyDashboard--wide' : '') + ''), _appendChild(_div2, [' ', (_uppyDashboardOverlay = document.createElement('div'), _uppyDashboardOverlay.setAttribute('tabindex', '-1'), _uppyDashboardOverlay.onclick = props.handleClickOutside, _uppyDashboardOverlay.setAttribute('class', 'UppyDashboard-overlay'), _uppyDashboardOverlay), ' ', (_uppyDashboardInner = document.createElement('div'), _onload(_uppyDashboardInner, function () {
    return props.updateDashboardElWidth();
  }, null, 1), _uppyDashboardInner.setAttribute('aria-modal', 'true'), _uppyDashboardInner.setAttribute('role', 'dialog'), _uppyDashboardInner.setAttribute('style', '\n          ' + String(props.inline && props.maxWidth ? 'max-width: ' + props.maxWidth + 'px;' : '') + '\n          ' + String(props.inline && props.maxHeight ? 'max-height: ' + props.maxHeight + 'px;' : '') + ''), _uppyDashboardInner.setAttribute('class', 'UppyDashboard-inner'), _appendChild(_uppyDashboardInner, [' ', (_uppyDashboardClose = document.createElement('button'), _uppyDashboardClose.setAttribute('type', 'button'), _uppyDashboardClose.setAttribute('aria-label', '' + String(props.i18n('closeModal')) + ''), _uppyDashboardClose.setAttribute('title', '' + String(props.i18n('closeModal')) + ''), _uppyDashboardClose.onclick = props.closeModal, _uppyDashboardClose.setAttribute('class', 'UppyDashboard-close'), _appendChild(_uppyDashboardClose, [closeIcon()]), _uppyDashboardClose), ' ', (_uppyDashboardInnerWrap = document.createElement('div'), _uppyDashboardInnerWrap.setAttribute('class', 'UppyDashboard-innerWrap'), _appendChild(_uppyDashboardInnerWrap, [' ', Tabs({
    files: props.files,
    handleInputChange: handleInputChange,
    acquirers: props.acquirers,
    panelSelectorPrefix: props.panelSelectorPrefix,
    showPanel: props.showPanel,
    i18n: props.i18n
  }), ' ', FileCard({
    files: props.files,
    fileCardFor: props.fileCardFor,
    done: props.fileCardDone,
    metaFields: props.metaFields,
    log: props.log,
    i18n: props.i18n
  }), ' ', (_uppyDashboardFilesContainer = document.createElement('div'), _uppyDashboardFilesContainer.setAttribute('class', 'UppyDashboard-filesContainer'), _appendChild(_uppyDashboardFilesContainer, [' ', FileList({
    acquirers: props.acquirers,
    files: props.files,
    handleInputChange: handleInputChange,
    showFileCard: props.showFileCard,
    showProgressDetails: props.showProgressDetails,
    totalProgress: props.totalProgress,
    totalFileCount: props.totalFileCount,
    info: props.info,
    note: props.note,
    i18n: props.i18n,
    log: props.log,
    removeFile: props.removeFile,
    pauseAll: props.pauseAll,
    resumeAll: props.resumeAll,
    pauseUpload: props.pauseUpload,
    startUpload: props.startUpload,
    cancelUpload: props.cancelUpload,
    retryUpload: props.retryUpload,
    resumableUploads: props.resumableUploads,
    isWide: props.isWide
  }), ' ', (_uppyDashboardActions = document.createElement('div'), _uppyDashboardActions.setAttribute('class', 'UppyDashboard-actions'), _appendChild(_uppyDashboardActions, [' ', !props.hideUploadButton && !props.autoProceed && props.newFiles.length > 0 ? UploadBtn({
    i18n: props.i18n,
    startUpload: props.startUpload,
    newFileCount: props.newFiles.length
  }) : null, ' ']), _uppyDashboardActions), ' ']), _uppyDashboardFilesContainer), ' ', (_uppyDashboardContentPanel = document.createElement('div'), _uppyDashboardContentPanel.setAttribute('role', 'tabpanel'), _uppyDashboardContentPanel.setAttribute('aria-hidden', '' + String(props.activePanel ? 'false' : 'true') + ''), _uppyDashboardContentPanel.setAttribute('class', 'UppyDashboardContent-panel'), _appendChild(_uppyDashboardContentPanel, [' ', props.activePanel ? renderInnerPanel(props) : '', ' ']), _uppyDashboardContentPanel), ' ', (_uppyDashboardProgressindicators = document.createElement('div'), _uppyDashboardProgressindicators.setAttribute('class', 'UppyDashboard-progressindicators'), _appendChild(_uppyDashboardProgressindicators, [' ', props.progressindicators.map(function (target) {
    return props.getPlugin(target.id).render(props.state);
  }), ' ']), _uppyDashboardProgressindicators), ' ']), _uppyDashboardInnerWrap), ' ']), _uppyDashboardInner), ' ']), _div2;
};
//# sourceMappingURL=Dashboard.js.map