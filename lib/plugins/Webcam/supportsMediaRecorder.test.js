'use strict';

var supportsMediaRecorder = require('./supportsMediaRecorder');

describe('supportsMediaRecorder', function () {
  it('should return true if MediaRecorder is supported', function () {
    global.MediaRecorder = function () {};
    global.MediaRecorder.prototype.start = function () {};
    expect(supportsMediaRecorder()).toEqual(true);
  });

  it('should return false if MediaRecorder is not supported', function () {
    global.MediaRecorder = undefined;
    expect(supportsMediaRecorder()).toEqual(false);

    global.MediaRecorder = function () {};
    expect(supportsMediaRecorder()).toEqual(false);

    global.MediaRecorder.prototype.foo = function () {};
    expect(supportsMediaRecorder()).toEqual(false);
  });
});
//# sourceMappingURL=supportsMediaRecorder.test.js.map