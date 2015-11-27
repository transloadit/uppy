(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Transloadit = (function () {
  function Transloadit(opts) {
    _classCallCheck(this, Transloadit);

    // Dictates in what order different plugin types are ran:
    this.types = ['presetter', 'selecter', 'uploader'];

    // Container for different types of plugins
    this.plugins = {};
  }

  _createClass(Transloadit, [{
    key: 'use',
    value: function use(Plugin, opts) {
      // Instantiate
      var plugin = new Plugin(this, opts);

      // Save in plugin container
      if (!this.plugins[plugin.type]) {
        this.plugins[plugin.type] = [];
      }
      this.plugins[plugin.type].push(plugin);

      return this;
    }
  }, {
    key: 'setProgress',
    value: function setProgress(plugin, percentage) {
      // Any plugin can call this via `this.core.setProgress(this, precentage)`
      console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage);

      return this;
    }
  }, {
    key: 'run',
    value: function run() {
      // Walk over plugins in the order as defined by this.types.
      var files = [];
      for (var j in this.types) {
        var type = this.types[j];
        // Walk over all plugins of this type, passing & modifying the files array as we go
        for (var i in this.plugins[type]) {
          var plugin = this.plugins[type][i];
          console.log('--> Now running ' + plugin.type + ' plugin ' + plugin.name + ': ');
          files = plugin.run(files);
          console.dir(files);
          console.log('');
        }
      }

      // core.run is the final step and retuns the results (vs every other method, returning `this`)
      // for chainability
      return files;
    }
  }]);

  return Transloadit;
})();

exports['default'] = Transloadit;
module.exports = exports['default'];

},{}]},{},[1]);
