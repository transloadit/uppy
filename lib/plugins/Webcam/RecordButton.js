'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

var RecordStartIcon = require('./RecordStartIcon');
var RecordStopIcon = require('./RecordStopIcon');

module.exports = function RecordButton(_ref) {
  var _uppyButtonCircular2;

  var recording = _ref.recording,
      onStartRecording = _ref.onStartRecording,
      onStopRecording = _ref.onStopRecording;

  if (recording) {
    var _uppyButtonCircular;

    return _uppyButtonCircular = document.createElement('button'), _uppyButtonCircular.setAttribute('type', 'button'), _uppyButtonCircular.setAttribute('title', 'Stop Recording'), _uppyButtonCircular.setAttribute('aria-label', 'Stop Recording'), _uppyButtonCircular.onclick = onStopRecording, _uppyButtonCircular.setAttribute('class', 'UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton'), _appendChild(_uppyButtonCircular, [' ', RecordStopIcon(), ' ']), _uppyButtonCircular;
  }

  return _uppyButtonCircular2 = document.createElement('button'), _uppyButtonCircular2.setAttribute('type', 'button'), _uppyButtonCircular2.setAttribute('title', 'Begin Recording'), _uppyButtonCircular2.setAttribute('aria-label', 'Begin Recording'), _uppyButtonCircular2.onclick = onStartRecording, _uppyButtonCircular2.setAttribute('class', 'UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton'), _appendChild(_uppyButtonCircular2, [' ', RecordStartIcon(), ' ']), _uppyButtonCircular2;
};
//# sourceMappingURL=RecordButton.js.map