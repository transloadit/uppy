'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

var Plugin = require('../Plugin');
var Translator = require('../../core/Translator');

var _require = require('../../core/Utils'),
    getFileTypeExtension = _require.getFileTypeExtension,
    canvasToBlob = _require.canvasToBlob;

var supportsMediaRecorder = require('./supportsMediaRecorder');
var WebcamIcon = require('./WebcamIcon');
var CameraScreen = require('./CameraScreen');
var PermissionsScreen = require('./PermissionsScreen');

// Setup getUserMedia, with polyfill for older browsers
// Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
function getMediaDevices() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices;
  }

  var _getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
  if (!_getUserMedia) {
    return null;
  }

  return {
    getUserMedia: function getUserMedia(opts) {
      return new _Promise(function (resolve, reject) {
        _getUserMedia.call(navigator, opts, resolve, reject);
      });
    }
  };
}

/**
 * Webcam
 */
module.exports = function (_Plugin) {
  _inherits(Webcam, _Plugin);

  function Webcam(core, opts) {
    _classCallCheck(this, Webcam);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.mediaDevices = getMediaDevices();
    _this.supportsUserMedia = !!_this.mediaDevices;
    _this.protocol = location.protocol.match(/https/i) ? 'https' : 'http';
    _this.type = 'acquirer';
    _this.id = 'Webcam';
    _this.title = 'Webcam';
    _this.icon = WebcamIcon;
    _this.focus = _this.focus.bind(_this);

    var defaultLocale = {
      strings: {
        smile: 'Smile!'
      }

      // set default options
    };var defaultOptions = {
      onBeforeSnapshot: function onBeforeSnapshot() {
        return Promise.resolve();
      },
      countdown: false,
      locale: defaultLocale,
      modes: ['video-audio', 'video-only', 'audio-only', 'picture']

      // merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOptions, opts);

    _this.locale = _extends({}, defaultLocale, _this.opts.locale);
    _this.locale.strings = _extends({}, defaultLocale.strings, _this.opts.locale.strings);

    // i18n
    _this.translator = new Translator({ locale: _this.locale });
    _this.i18n = _this.translator.translate.bind(_this.translator);

    _this.install = _this.install.bind(_this);
    _this.setPluginState = _this.setPluginState.bind(_this);

    _this.render = _this.render.bind(_this);

    // Camera controls
    _this.start = _this.start.bind(_this);
    _this.stop = _this.stop.bind(_this);
    _this.takeSnapshot = _this.takeSnapshot.bind(_this);
    _this.startRecording = _this.startRecording.bind(_this);
    _this.stopRecording = _this.stopRecording.bind(_this);
    _this.oneTwoThreeSmile = _this.oneTwoThreeSmile.bind(_this);

    _this.webcamActive = false;

    if (_this.opts.countdown) {
      _this.opts.onBeforeSnapshot = _this.oneTwoThreeSmile;
    }
    return _this;
  }

  Webcam.prototype.start = function start() {
    var _this2 = this;

    if (!this.mediaDevices) {
      return Promise.reject(new Error('Webcam access not supported'));
    }

    this.webcamActive = true;

    var acceptsAudio = this.opts.modes.indexOf('video-audio') !== -1 || this.opts.modes.indexOf('audio-only') !== -1;
    var acceptsVideo = this.opts.modes.indexOf('video-audio') !== -1 || this.opts.modes.indexOf('video-only') !== -1 || this.opts.modes.indexOf('picture') !== -1;

    // ask user for access to their camera
    return this.mediaDevices.getUserMedia({
      audio: acceptsAudio,
      video: acceptsVideo
    }).then(function (stream) {
      _this2.stream = stream;
      _this2.streamSrc = URL.createObjectURL(_this2.stream);
      _this2.setPluginState({
        cameraReady: true
      });
    }).catch(function (err) {
      _this2.setPluginState({
        cameraError: err
      });
    });
  };

  Webcam.prototype.startRecording = function startRecording() {
    var _this3 = this;

    // TODO We can check here if any of the mime types listed in the
    // mimeToExtensions map in Utils.js are supported, and prefer to use one of
    // those.
    // Right now we let the browser pick a type that it deems appropriate.
    this.recorder = new MediaRecorder(this.stream);
    this.recordingChunks = [];
    this.recorder.addEventListener('dataavailable', function (event) {
      _this3.recordingChunks.push(event.data);
    });
    this.recorder.start();

    this.setPluginState({
      isRecording: true
    });
  };

  Webcam.prototype.stopRecording = function stopRecording() {
    var _this4 = this;

    var stopped = new _Promise(function (resolve, reject) {
      _this4.recorder.addEventListener('stop', function () {
        resolve();
      });
      _this4.recorder.stop();
    });

    return stopped.then(function () {
      _this4.setPluginState({
        isRecording: false
      });
      return _this4.getVideo();
    }).then(function (file) {
      return _this4.core.addFile(file);
    }).then(function () {
      _this4.recordingChunks = null;
      _this4.recorder = null;
    }, function (error) {
      _this4.recordingChunks = null;
      _this4.recorder = null;
      throw error;
    });
  };

  Webcam.prototype.stop = function stop() {
    this.stream.getAudioTracks().forEach(function (track) {
      track.stop();
    });
    this.stream.getVideoTracks().forEach(function (track) {
      track.stop();
    });
    this.webcamActive = false;
    this.stream = null;
    this.streamSrc = null;
  };

  Webcam.prototype.getVideoElement = function getVideoElement() {
    return this.target.querySelector('.UppyWebcam-video');
  };

  Webcam.prototype.oneTwoThreeSmile = function oneTwoThreeSmile() {
    var _this5 = this;

    return new _Promise(function (resolve, reject) {
      var count = _this5.opts.countdown;

      var countDown = setInterval(function () {
        if (!_this5.webcamActive) {
          clearInterval(countDown);
          _this5.captureInProgress = false;
          return reject(new Error('Webcam is not active'));
        }

        if (count > 0) {
          _this5.core.info(count + '...', 'warning', 800);
          count--;
        } else {
          clearInterval(countDown);
          _this5.core.info(_this5.i18n('smile'), 'success', 1500);
          setTimeout(function () {
            return resolve();
          }, 1500);
        }
      }, 1000);
    });
  };

  Webcam.prototype.takeSnapshot = function takeSnapshot() {
    var _this6 = this;

    if (this.captureInProgress) return;
    this.captureInProgress = true;

    this.opts.onBeforeSnapshot().catch(function (err) {
      var message = (typeof err === 'undefined' ? 'undefined' : _typeof(err)) === 'object' ? err.message : err;
      _this6.core.info(message, 'error', 5000);
      return Promise.reject(new Error('onBeforeSnapshot: ' + message));
    }).then(function () {
      return _this6.getImage();
    }).then(function (tagFile) {
      _this6.captureInProgress = false;
      _this6.core.addFile(tagFile);
    }, function (error) {
      _this6.captureInProgress = false;
      throw error;
    });
  };

  Webcam.prototype.getImage = function getImage() {
    var _this7 = this;

    var video = this.getVideoElement();
    if (!video) {
      return Promise.reject(new Error('No video element found, likely due to the Webcam tab being closed.'));
    }

    var name = 'webcam-' + Date.now() + '.jpg';
    var mimeType = 'image/jpeg';

    var canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    return canvasToBlob(canvas, mimeType).then(function (blob) {
      return {
        source: _this7.id,
        name: name,
        data: new File([blob], name, { type: mimeType }),
        type: mimeType
      };
    });
  };

  Webcam.prototype.getVideo = function getVideo() {
    var mimeType = this.recordingChunks[0].type;
    var fileExtension = getFileTypeExtension(mimeType);

    if (!fileExtension) {
      return Promise.reject(new Error('Could not retrieve recording: Unsupported media type "' + mimeType + '"'));
    }

    var name = 'webcam-' + Date.now() + '.' + fileExtension;
    var blob = new Blob(this.recordingChunks, { type: mimeType });
    var file = {
      source: this.id,
      name: name,
      data: new File([blob], name, { type: mimeType }),
      type: mimeType
    };

    return Promise.resolve(file);
  };

  Webcam.prototype.focus = function focus() {
    var _this8 = this;

    if (this.opts.countdown) return;
    setTimeout(function () {
      _this8.core.info(_this8.i18n('smile'), 'success', 1500);
    }, 1000);
  };

  Webcam.prototype.render = function render(state) {
    if (!this.webcamActive) {
      this.start();
    }

    var webcamState = this.getPluginState();

    if (!webcamState.cameraReady) {
      return PermissionsScreen(webcamState);
    }

    return CameraScreen(_extends({}, webcamState, {
      onSnapshot: this.takeSnapshot,
      onStartRecording: this.startRecording,
      onStopRecording: this.stopRecording,
      onFocus: this.focus,
      onStop: this.stop,
      modes: this.opts.modes,
      supportsRecording: supportsMediaRecorder(),
      recording: webcamState.isRecording,
      src: this.streamSrc
    }));
  };

  Webcam.prototype.install = function install() {
    this.setPluginState({
      cameraReady: false
    });

    var target = this.opts.target;
    var plugin = this;
    this.target = this.mount(target, plugin);
  };

  Webcam.prototype.uninstall = function uninstall() {
    if (this.stream) {
      this.stop();
    }

    this.unmount();
  };

  return Webcam;
}(Plugin);
//# sourceMappingURL=index.js.map