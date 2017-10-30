'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

var _require = require('./icons'),
    uploadIcon = _require.uploadIcon;

module.exports = function (props) {
  var _uppyDashboardUploadCount, _uppyButtonCircular;

  props = props || {};

  return _uppyButtonCircular = document.createElement('button'), _uppyButtonCircular.setAttribute('type', 'button'), _uppyButtonCircular.setAttribute('title', '' + String(props.i18n('uploadAllNewFiles')) + ''), _uppyButtonCircular.setAttribute('aria-label', '' + String(props.i18n('uploadAllNewFiles')) + ''), _uppyButtonCircular.onclick = props.startUpload, _uppyButtonCircular.setAttribute('class', 'UppyButton--circular\n                   UppyButton--blue\n                   UppyDashboard-upload'), _appendChild(_uppyButtonCircular, [' ', uploadIcon(), ' ', (_uppyDashboardUploadCount = document.createElement('sup'), _uppyDashboardUploadCount.setAttribute('title', '' + String(props.i18n('numberOfSelectedFiles')) + ''), _uppyDashboardUploadCount.setAttribute('aria-label', '' + String(props.i18n('numberOfSelectedFiles')) + ''), _uppyDashboardUploadCount.setAttribute('class', 'UppyDashboard-uploadCount'), _appendChild(_uppyDashboardUploadCount, [' ', props.newFileCount]), _uppyDashboardUploadCount), ' ']), _uppyButtonCircular;
};
//# sourceMappingURL=UploadBtn.js.map