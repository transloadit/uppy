'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

module.exports = function (props) {
  var _h, _br, _p, _uppyWebcamPermissons;

  return _uppyWebcamPermissons = document.createElement('div'), _uppyWebcamPermissons.setAttribute('class', 'uppy-Webcam-permissons'), _appendChild(_uppyWebcamPermissons, [' ', (_h = document.createElement('h1'), _h.textContent = 'Please allow access to your camera', _h), ' ', (_p = document.createElement('p'), _appendChild(_p, ['You have been prompted to allow camera access from this site.', (_br = document.createElement('br'), _br), ' In order to take pictures with your camera you must approve this request.']), _p), ' ']), _uppyWebcamPermissons;
};
//# sourceMappingURL=PermissionsScreen.js.map