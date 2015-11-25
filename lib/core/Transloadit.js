'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _default = (function () {
  function _default(opts) {
    _classCallCheck(this, _default);

    // Dictates in what order different plugin types are ran:
    this.types = ['presetter', 'selecter', 'uploader'];

    // Container for different types of plugins
    this.plugins = {};
  }

  _createClass(_default, [{
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

  return _default;
})();

exports['default'] = _default;
module.exports = exports['default'];