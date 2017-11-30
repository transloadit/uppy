'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

var CameraIcon = require('./CameraIcon');

module.exports = function SnapshotButton(_ref) {
  var _uppyButtonCircular;

  var onSnapshot = _ref.onSnapshot;

  return _uppyButtonCircular = document.createElement('button'), _uppyButtonCircular.setAttribute('type', 'button'), _uppyButtonCircular.setAttribute('title', 'Take a snapshot'), _uppyButtonCircular.setAttribute('aria-label', 'Take a snapshot'), _uppyButtonCircular.onclick = onSnapshot, _uppyButtonCircular.setAttribute('class', 'UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton'), _appendChild(_uppyButtonCircular, [' ', CameraIcon(), ' ']), _uppyButtonCircular;
};
//# sourceMappingURL=SnapshotButton.js.map