'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

var FileItem = require('./FileItem');
var ActionBrowseTagline = require('./ActionBrowseTagline');

var _require = require('./icons'),
    dashboardBgIcon = _require.dashboardBgIcon;

module.exports = function (props) {
  var _ul, _uppyDashboardDropFilesTitle, _uppyDashboardBgIcon, _uppyDashboardNote;

  return _ul = document.createElement('ul'), _ul.setAttribute('class', 'UppyDashboard-files\n                         ' + String(props.totalFileCount === 0 ? 'UppyDashboard-files--noFiles' : '') + ''), _appendChild(_ul, [' ', props.totalFileCount === 0 ? (_uppyDashboardBgIcon = document.createElement('div'), _uppyDashboardBgIcon.setAttribute('class', 'UppyDashboard-bgIcon'), _appendChild(_uppyDashboardBgIcon, [' ', dashboardBgIcon(), ' ', (_uppyDashboardDropFilesTitle = document.createElement('h3'), _uppyDashboardDropFilesTitle.setAttribute('class', 'UppyDashboard-dropFilesTitle'), _appendChild(_uppyDashboardDropFilesTitle, [' ', ActionBrowseTagline({
    acquirers: props.acquirers,
    handleInputChange: props.handleInputChange,
    i18n: props.i18n
  }), ' ']), _uppyDashboardDropFilesTitle), ' ', props.note ? (_uppyDashboardNote = document.createElement('p'), _uppyDashboardNote.setAttribute('class', 'UppyDashboard-note'), _appendChild(_uppyDashboardNote, [props.note]), _uppyDashboardNote) : '', ' ']), _uppyDashboardBgIcon) : null, ' ', Object.keys(props.files).map(function (fileID) {
    return FileItem({
      acquirers: props.acquirers,
      file: props.files[fileID],
      showFileCard: props.showFileCard,
      showProgressDetails: props.showProgressDetails,
      info: props.info,
      log: props.log,
      i18n: props.i18n,
      removeFile: props.removeFile,
      pauseUpload: props.pauseUpload,
      cancelUpload: props.cancelUpload,
      retryUpload: props.retryUpload,
      resumableUploads: props.resumableUploads,
      isWide: props.isWide
    });
  }), ' ']), _ul;
};
//# sourceMappingURL=FileList.js.map