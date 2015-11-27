(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _srcCore = require('../../../src/core');

var _srcCore2 = _interopRequireDefault(_srcCore);

var _srcPlugins = require('../../../src/plugins');

_srcPlugins.DropboxPlugin.connect('target');

},{"../../../src/core":3,"../../../src/plugins":9}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Transloadit = require('./Transloadit');

var _Transloadit2 = _interopRequireDefault(_Transloadit);

exports['default'] = _Transloadit2['default'];
module.exports = exports['default'];

},{"./Transloadit":2}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _TransloaditPlugin2 = require('./TransloaditPlugin');

var _TransloaditPlugin3 = _interopRequireDefault(_TransloaditPlugin2);

// This is how we roll $('.element').toggleClass in non-jQuery world
function toggleClass(el, className) {
  // console.log(el);

  if (el.classList) {
    el.classList.toggle(className);
  } else {
    var classes = el.className.split(' ');
    var existingIndex = classes.indexOf(className);

    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1);
    } else {
      classes.push(className);
      el.className = classes.join(' ');
    }
  }
}

var DragDrop = (function (_TransloaditPlugin) {
  _inherits(DragDrop, _TransloaditPlugin);

  function DragDrop(core, opts) {
    _classCallCheck(this, DragDrop);

    _get(Object.getPrototypeOf(DragDrop.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'selecter';
    this.opts = opts;
    console.log(this.opts);

    // get the element where Drag & Drop event will occur
    this.dropzone = document.querySelectorAll(this.opts.selector)[0];

    // crazy stuff so that ‘this’ will behave in class
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  _createClass(DragDrop, [{
    key: 'listenForEvents',
    value: function listenForEvents() {
      this.dropzone.addEventListener('dragenter', this.handleDragEnter);
      this.dropzone.addEventListener('dragover', this.handleDragOver);
      this.dropzone.addEventListener('drop', this.handleDrop);
      console.log('waiting for some files to be dropped on ' + this.opts.selector);
    }
  }, {
    key: 'handleDragEnter',
    value: function handleDragEnter(e) {
      event.stopPropagation();
      event.preventDefault();
      toggleClass(this.dropzone, 'is-dragover');
    }
  }, {
    key: 'handleDragOver',
    value: function handleDragOver(e) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, {
    key: 'handleDrop',
    value: function handleDrop(e) {
      console.log('all right, someone dropped something here...');
      e.preventDefault();
      toggleClass(this.dropzone, 'is-dragover');
      var files = e.dataTransfer.files;
      console.log(files);
      this.handleFiles(files);
    }
  }, {
    key: 'handleFiles',
    value: function handleFiles(files) {
      return files;
    }
  }, {
    key: 'run',
    value: function run(files) {
      this.listenForEvents();
      // this.core.setProgress(this, 0);
      var selected = [{ name: 'lolcat.jpeg' }];
      // this.core.setProgress(this, 100);

      // return selected;
    }
  }]);

  return DragDrop;
})(_TransloaditPlugin3['default']);

exports['default'] = DragDrop;
module.exports = exports['default'];

},{"./TransloaditPlugin":7}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var DropboxPlugin = (function () {
  function DropboxPlugin() {
    _classCallCheck(this, DropboxPlugin);

    this.connect = this.connect.bind(this);
    this.render = this.render.bind(this);
    this.files = [];
    this.currentDir = '/';
  }

  _createClass(DropboxPlugin, [{
    key: 'connect',
    value: function connect(target) {
      this._target = document.getElementById(target);

      this.client = new Dropbox.Client({ key: 'b7dzc9ei5dv5hcv', token: '' });
      this.client.authDriver(new Dropbox.AuthDriver.Redirect());
      this.client.authenticate();

      if (this.client.credentials().token) {
        this.getDirectory();
      }
    }
  }, {
    key: 'authenticate',
    value: function authenticate() {}
  }, {
    key: 'addFile',
    value: function addFile() {}
  }, {
    key: 'getDirectory',
    value: function getDirectory() {
      var _this = this;

      return this.client.readdir(this.currentDir, function (error, entries, stat, statFiles) {
        if (error) {
          return showError(error); // Something went wrong.
        }
        return _this.render(statFiles);
      });
    }
  }, {
    key: 'run',
    value: function run() {}
  }, {
    key: 'render',
    value: function render(files) {
      var _this2 = this;

      // for each file in the directory, create a list item element
      var elems = files.map(function (file, i) {
        var icon = file.isFolder ? 'folder' : 'file';
        return '<li data-type="' + icon + '" data-name="' + file.name + '"><span>' + icon + ' : </span><span> ' + file.name + '</span></li>';
      });

      // appends the list items to the target
      this._target.innerHTML = elems.sort().join('');

      if (this.currentDir.length > 1) {
        var _parent = document.createElement('LI');
        _parent.setAttribute('data-type', 'parent');
        _parent.innerHTML = '<span>...</span>';
        this._target.appendChild(_parent);
      }

      // add an onClick to each list item
      var fileElems = this._target.querySelectorAll('li');

      Array.prototype.forEach.call(fileElems, function (element) {
        var type = element.getAttribute('data-type');

        if (type === 'file') {
          element.addEventListener('click', function () {
            _this2.files.push(element.getAttribute('data-name'));
            console.dir('files: ' + _this2.files);
          });
        } else {
          element.addEventListener('dblclick', function () {
            var length = _this2.currentDir.split('/').length;

            if (type === 'folder') {
              _this2.currentDir = '' + _this2.currentDir + element.getAttribute('data-name') + '/';
            } else if (type === 'parent') {
              _this2.currentDir = _this2.currentDir.split('/').slice(0, length - 2).join('/') + '/';
            }
            console.log(_this2.currentDir);
            _this2.getDirectory();
          });
        }
      });
    }
  }]);

  return DropboxPlugin;
})();

exports['default'] = new DropboxPlugin();
module.exports = exports['default'];

},{}],6:[function(require,module,exports){
'use strict';

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _TransloaditPlugin2 = require('./TransloaditPlugin');

var _TransloaditPlugin3 = _interopRequireDefault(_TransloaditPlugin2);

var TransloaditBasic = (function (_TransloaditPlugin) {
  _inherits(TransloaditBasic, _TransloaditPlugin);

  function TransloaditBasic(core, opts) {
    _classCallCheck(this, TransloaditBasic);

    _get(Object.getPrototypeOf(TransloaditBasic.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'presetter';
    this.core.use(DragDrop, { modal: true, wait: true }).use(Tus10, { endpoint: 'http://master.tus.io:8080' });
  }

  return TransloaditBasic;
})(_TransloaditPlugin3['default']);

},{"./TransloaditPlugin":7}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _TransloaditPlugin2 = require('./TransloaditPlugin');

var _TransloaditPlugin3 = _interopRequireDefault(_TransloaditPlugin2);

var Tus10 = (function (_TransloaditPlugin) {
  _inherits(Tus10, _TransloaditPlugin);

  function Tus10(core, opts) {
    _classCallCheck(this, Tus10);

    _get(Object.getPrototypeOf(Tus10.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'uploader';
  }

  _createClass(Tus10, [{
    key: 'run',
    value: function run(files) {
      this.core.setProgress(this, 0);
      var uploaded = [];
      for (var i in files) {
        var file = files[i];
        this.core.setProgress(this, i * 1 + 1);
        uploaded[i] = file;
        uploaded[i].url = this.opts.endpoint + '/uploaded/' + file.name;
      }
      this.core.setProgress(this, 100);

      return uploaded;
    }
  }]);

  return Tus10;
})(_TransloaditPlugin3['default']);

exports['default'] = Tus10;
module.exports = exports['default'];

},{"./TransloaditPlugin":7}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _TransloaditPlugin = require('./TransloaditPlugin');

var _TransloaditPlugin2 = _interopRequireDefault(_TransloaditPlugin);

var _DragDrop = require('./DragDrop');

var _DragDrop2 = _interopRequireDefault(_DragDrop);

var _Dropbox = require('./Dropbox');

var _Dropbox2 = _interopRequireDefault(_Dropbox);

var _TransloaditBasic = require('./TransloaditBasic');

var _TransloaditBasic2 = _interopRequireDefault(_TransloaditBasic);

var _Tus10 = require('./Tus10');

var _Tus102 = _interopRequireDefault(_Tus10);

exports['default'] = {
  TransloaditPlugin: _TransloaditPlugin2['default'],
  DropboxPlugin: _Dropbox2['default'],
  DragDrop: _DragDrop2['default'],
  TransloaditBasic: _TransloaditBasic2['default'],
  Tus10: _Tus102['default']
};
module.exports = exports['default'];

},{"./DragDrop":4,"./Dropbox":5,"./TransloaditBasic":6,"./TransloaditPlugin":7,"./Tus10":8}]},{},[1]);
