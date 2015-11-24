"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TransloaditPlugin = (function () {
  // This contains boilerplate that all TransloaditPlugins share - and should not be used
  // directly. It also shows which methods final plugins should implement/override,
  // this deciding on structure.

  function TransloaditPlugin(core, opts) {
    _classCallCheck(this, TransloaditPlugin);

    this.core = core;
    this.opts = opts;
    this.name = this.constructor.name;
  }

  _createClass(TransloaditPlugin, [{
    key: "run",
    value: function run(files) {
      return files;
    }
  }]);

  return TransloaditPlugin;
})();

exports["default"] = TransloaditPlugin;
module.exports = exports["default"];