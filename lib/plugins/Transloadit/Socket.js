'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var io = require('socket.io-client');
var Emitter = require('namespace-emitter');
var parseUrl = require('url-parse');

/**
 * WebSocket status API client for Transloadit.
 */
module.exports = function () {
  function TransloaditSocket(url, assembly) {
    _classCallCheck(this, TransloaditSocket);

    var emitter = Emitter();
    this.on = emitter.on.bind(emitter);
    this.off = emitter.off.bind(emitter);
    this.emit = emitter.emit.bind(emitter);

    var parsed = parseUrl(url);

    this.assembly = assembly;
    this.socket = io.connect(parsed.origin, {
      path: parsed.pathname
    });

    this.attachDefaultHandlers();
  }

  TransloaditSocket.prototype.attachDefaultHandlers = function attachDefaultHandlers() {
    var _this = this;

    this.socket.on('connect', function () {
      _this.socket.emit('assembly_connect', {
        id: _this.assembly.assembly_id
      });

      _this.emit('connect');
    });

    this.socket.on('assembly_finished', function () {
      _this.emit('finished');

      _this.close();
    });

    this.socket.on('assembly_upload_finished', function (file) {
      _this.emit('upload', file);
    });

    this.socket.on('assembly_upload_meta_data_extracted', function () {
      _this.emit('metadata');
    });

    this.socket.on('assembly_result_finished', function (stepName, result) {
      _this.emit('result', stepName, result);
    });

    this.socket.on('assembly_error', function (err) {
      _this.emit('error', _extends(new Error(err.message), err));
    });
  };

  TransloaditSocket.prototype.close = function close() {
    this.socket.disconnect();
  };

  return TransloaditSocket;
}();
//# sourceMappingURL=Socket.js.map