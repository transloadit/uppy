'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getFormData = require('get-form-data');
var nanoraf = require('nanoraf');
var yo = require('yo-yo');

var _require = require('../core/Utils'),
    findDOMElement = _require.findDOMElement;

var Plugin = require('./Plugin');

jest.mock('get-form-data');
jest.mock('nanoraf');
jest.mock('../core/Utils', function () {
  return {
    findDOMElement: jest.fn()
  };
});

getFormData.mockImplementation(function () {
  return { foo: 'bar' };
});
nanoraf.mockImplementation(function (cb) {
  cb({ some: 'state' }); // eslint-disable-line standard/no-callback-literal
  return function () {};
});

describe('Plugin', function () {
  var plugin = void 0;

  afterEach(function () {
    getFormData.mockClear();
  });

  it('is a class', function () {
    expect(typeof Plugin === 'undefined' ? 'undefined' : _typeof(Plugin)).toBe('function');
  });

  it('accepts two parameters', function () {
    expect(Plugin.length).toBe(2);
  });

  it('defaults options when not passed as an argument', function () {
    plugin = new Plugin();
    expect(_typeof(plugin.opts)).toBe('object');
  });

  describe('plugin state', function () {
    var MockPlugin = function (_Plugin) {
      _inherits(MockPlugin, _Plugin);

      function MockPlugin(core, opts) {
        _classCallCheck(this, MockPlugin);

        var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

        _this.id = 'MockPlugin';
        return _this;
      }

      return MockPlugin;
    }(Plugin);

    it('returns plugin state from `getPluginState()`', function () {
      var mockState = {};
      plugin = new MockPlugin({
        state: {
          plugins: {
            MockPlugin: mockState
          }
        }
      });

      expect(plugin.getPluginState()).toBe(mockState);
    });

    it('merges plugin state using `setPluginState()`', function () {
      var initialState = {
        plugins: {
          MockPlugin: {
            hello: 'world',
            asdf: 'quux'
          }
        }
      };

      plugin = new MockPlugin({
        setState: function setState(patch) {
          this.state = _extends({}, this.state, patch);
        },

        state: initialState
      });

      plugin.setPluginState({ hello: 'friends' });

      expect(plugin.core.state).not.toBe(initialState);
      expect(plugin.getPluginState()).toEqual({
        hello: 'friends',
        asdf: 'quux'
      });
    });
  });

  // it('sets `replaceTargetContent` based on options argument', () => {
  //   plugin = new Plugin(null, { replaceTargetContent: false })
  //   expect(plugin.opts.replaceTargetContent).toBe(false)
  // })

  // it('defaults `replaceTargetContent` to true when not passed as an option', () => {
  //   plugin = new Plugin()
  //   expect(plugin.opts.replaceTargetContent).toBe(true)
  // })

  describe('.update', function () {
    beforeEach(function () {
      plugin = new Plugin();
      plugin.render = jest.fn(function () {
        return { ren: 'der' };
      });
    });

    it('is a function', function () {
      expect(_typeof(Plugin.prototype.update)).toBe('function');
    });

    it('accepts one parameter', function () {
      expect(Plugin.prototype.update.length).toBe(1);
    });

    it('does nothing when plugin has no UI element (`el`)', function () {
      plugin.updateUI = jest.fn();
      expect(plugin.update()).toBe(undefined);
      expect(plugin.updateUI.mock.calls.length).toBe(0);
    });

    it('calls updateUI method with state when UI element (`el`) exists', function () {
      plugin.el = {};
      plugin.updateUI = jest.fn();
      plugin.update({ foo: 'bar' });
      expect(plugin.updateUI.mock.calls.length).toBe(1);
      expect(plugin.updateUI.mock.calls[0][0]).toEqual({ foo: 'bar' });
    });

    it('does nothing when a UI element exists but and no updateUI method', function () {
      plugin.el = {};
      expect(function () {
        return plugin.update();
      }).not.toThrow();
    });
  });

  describe('.mount', function () {
    var addTarget = jest.fn(function () {
      return 'body';
    });
    var mockCore = {
      iteratePlugins: function iteratePlugins(cb) {
        cb(new mockTarget()); // eslint-disable-line new-cap
      },
      log: jest.fn(),
      setMeta: jest.fn(),
      state: 'default'
    };
    var mockPlugin = {
      id: 'pID'
    };
    var mockTarget = function mockTarget() {
      this.id = 'tID';
      this.addTarget = addTarget;
    };

    var yoUpdateSpy = void 0;

    beforeEach(function () {
      yoUpdateSpy = jest.spyOn(yo, 'update').mockImplementation(function () {
        return { yo: 'el' };
      });
      plugin = new Plugin(mockCore, { getMetaFromForm: true });
      plugin.render = jest.fn(function () {
        return { ren: 'der' };
      });
    });

    afterEach(function () {
      findDOMElement.mockReset();
      findDOMElement.mockRestore();
      mockCore.log.mockReset();
      mockCore.setMeta.mockReset();
      yoUpdateSpy.mockReset();
      yoUpdateSpy.mockRestore();
    });

    it('is a function', function () {
      expect(_typeof(Plugin.prototype.mount)).toBe('function');
    });

    it('accepts two parameters', function () {
      expect(Plugin.prototype.mount.length).toBe(2);
    });

    it('adds updateUI method', function () {
      plugin.mount(mockTarget, mockPlugin);
      expect(_typeof(plugin.updateUI)).toBe('function');
    });

    it('sets `el` property when state has changed', function () {
      expect.assertions(4);

      expect(plugin.el).toBe(undefined);

      plugin.mount(mockTarget, mockPlugin);

      expect(plugin.render.mock.calls[0][0]).toEqual({ some: 'state' });
      expect(yo.update.mock.calls[0]).toEqual([undefined, { ren: 'der' }]);
      expect(plugin.el).toEqual({ yo: 'el' });
    });

    describe('when target is a DOM element', function () {
      var mockElement = void 0;
      var appendChild = jest.fn();

      beforeEach(function () {
        mockElement = {
          nodeName: 'FORM',
          innerHTML: 'foo',
          appendChild: appendChild
        };
        mockPlugin.render = jest.fn(function () {
          return { el: 'lo' };
        });
        findDOMElement.mockImplementation(function () {
          return mockElement;
        });
      });

      afterEach(function () {
        findDOMElement.mockReset();
        findDOMElement.mockRestore();
      });

      it('logs installation', function () {
        plugin.mount(mockTarget, mockPlugin);
        expect(mockCore.log.mock.calls.length).toBe(1);
        expect(/DOM element/.test(mockCore.log.mock.calls[0][0])).toBe(true);
      });

      it('sets form data to core\'s meta data when target is a form', function () {
        plugin.mount(mockTarget, mockPlugin);
        expect(getFormData.mock.calls[0][0]).toEqual(mockElement);
        expect(mockCore.setMeta.mock.calls[0][0]).toEqual({ foo: 'bar' });
      });

      it('does not set data to core\'s meta data when `getMetaFromForm` isn\'t a Plugin option', function () {
        plugin = new Plugin(mockCore);
        plugin.render = function () {};
        plugin.mount(mockTarget, mockPlugin);
        expect(mockCore.setMeta.mock.calls.length).toBe(0);
      });

      it('does not set data to core\'s meta data when target is not a form', function () {
        mockElement.nodeName = 'FOO';

        plugin.mount(mockTarget, mockPlugin);
        expect(mockCore.setMeta.mock.calls.length).toBe(0);
      });

      it('does not remove content from target when `replaceTargetContent` is not set', function () {
        plugin = new Plugin(mockCore);
        plugin.render = function () {};
        plugin.mount(mockTarget, mockPlugin);
        expect(mockElement.innerHTML).toBe('foo');
      });

      it('removes content from target when `replaceTargetContent` is set', function () {
        plugin = new Plugin(mockCore, { replaceTargetContent: true });
        plugin.render = function () {};
        plugin.mount(mockTarget, mockPlugin);
        expect(mockElement.innerHTML).toBe('');
      });

      it('sets `el` to plugin rendered with state', function () {
        plugin.mount(mockTarget, mockPlugin);
        expect(mockPlugin.render.mock.calls[0][0]).toBe('default');
        expect(plugin.el).toEqual({ el: 'lo' });
      });

      it('appends plugin\'s element to target', function () {
        plugin.mount(mockTarget, mockPlugin);
        expect(mockElement.appendChild.mock.calls[0][0]).toEqual({ el: 'lo' });
      });

      it('returns the target DOM element', function () {
        plugin = new Plugin(mockCore, { replaceTargetContent: true });
        plugin.render = function () {};
        var target = plugin.mount(mockTarget, mockPlugin);
        expect(target).toEqual({
          nodeName: 'FORM',
          innerHTML: '',
          appendChild: appendChild
        });
      });
    });

    describe('when target is a plugin', function () {
      it('logs installation', function () {
        plugin.mount(mockTarget, mockPlugin);
        expect(mockCore.log.mock.calls.length).toBe(1);
        expect(/tID/.test(mockCore.log.mock.calls[0][0])).toBe(true);
      });

      it('adds plugin to target', function () {
        plugin.mount(mockTarget, mockPlugin);
        expect(addTarget.mock.calls[0][0]).toEqual(mockPlugin);
      });

      it('returns plugin\'s target', function () {
        var target = plugin.mount(mockTarget, mockPlugin);
        expect(target).toBe('body');
      });
    });
  });

  describe('.render', function () {
    beforeEach(function () {
      plugin = new Plugin();
    });

    it('is a function', function () {
      expect(_typeof(Plugin.prototype.render)).toBe('function');
    });

    it('accepts one parameter', function () {
      expect(Plugin.prototype.render.length).toBe(1);
    });

    it('throws by default', function () {
      expect(function () {
        return plugin.render();
      }).toThrow();
    });
  });

  describe('.addTarget', function () {
    beforeEach(function () {
      plugin = new Plugin();
    });

    it('is a function', function () {
      expect(_typeof(Plugin.prototype.addTarget)).toBe('function');
    });

    it('accepts one parameter', function () {
      expect(Plugin.prototype.addTarget.length).toBe(1);
    });

    it('throws by default', function () {
      expect(function () {
        return plugin.addTarget();
      }).toThrow();
    });
  });

  describe('.unmount', function () {
    beforeEach(function () {
      plugin = new Plugin();
    });

    it('is a function', function () {
      expect(_typeof(Plugin.prototype.unmount)).toBe('function');
    });

    it('removes plugin\'s UI element', function () {
      var removeChild = jest.fn();
      var el = {
        parentNode: {
          removeChild: removeChild
        }
      };
      plugin.el = el;
      plugin.unmount();
      expect(removeChild.mock.calls.length).toBe(1);
      expect(removeChild.mock.calls[0][0]).toEqual(el);
    });

    it('does nothing when no UI element or parent', function () {
      plugin.el = {};
      expect(function () {
        return plugin.unmount();
      }).not.toThrow();
    });
  });

  describe('.install', function () {
    it('is a function', function () {
      expect(_typeof(Plugin.prototype.install)).toBe('function');
    });
  });

  describe('.uninstall', function () {
    it('is a function', function () {
      expect(_typeof(Plugin.prototype.uninstall)).toBe('function');
    });

    it('calls unmount method', function () {
      var spy = jest.spyOn(Plugin.prototype, 'unmount');
      var plugin = new Plugin();
      plugin.uninstall();
      expect(spy.mock.calls.length).toBe(1);
      spy.mockReset();
      spy.mockRestore();
    });
  });
});
//# sourceMappingURL=Plugin.test.js.map