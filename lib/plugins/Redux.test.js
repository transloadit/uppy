'use strict';

var _Redux = require('./Redux');

var _Redux2 = _interopRequireDefault(_Redux);

var _Plugin = require('./Plugin');

var _Plugin2 = _interopRequireDefault(_Plugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('uploader/reduxPlugin', function () {
  it('should initialise successfully', function () {
    var actionFunction = function actionFunction() {};
    var dispatchFunction = function dispatchFunction() {};
    var redux = new _Redux2.default(null, {
      action: actionFunction,
      dispatch: dispatchFunction
    });
    expect(redux instanceof _Plugin2.default).toEqual(true);
    expect(redux.opts.action).toBe(actionFunction);
    expect(redux.opts.dispatch).toBe(dispatchFunction);
  });

  it('should throw an error if the action option is not specified', function () {
    var dispatchFunction = function dispatchFunction() {};

    expect(function () {
      new _Redux2.default(null, { dispatch: dispatchFunction }); // eslint-disable-line no-new
    }).toThrow('action option is not defined');
  });

  it('should throw an error if the dispatch option is not specified', function () {
    var actionFunction = function actionFunction() {};

    expect(function () {
      new _Redux2.default(null, { action: actionFunction }); // eslint-disable-line no-new
    }).toThrow('dispatch option is not defined');
  });

  describe('install', function () {
    it('should subscribe to uppy events', function () {
      var core = {
        emitter: {
          on: jest.fn()
        }
      };

      var redux = new _Redux2.default(core, {
        action: function action() {},
        dispatch: function dispatch() {}
      });
      redux.handleStateUpdate = jest.fn();
      redux.install();

      expect(core.emitter.on.mock.calls.length).toEqual(1);
      expect(core.emitter.on.mock.calls[0]).toEqual(['core:state-update', redux.handleStateUpdate]);
    });

    it('should call this.handleStateUpdate with the current state on install', function () {
      var core = {
        emitter: {
          on: jest.fn()
        }
      };

      var redux = new _Redux2.default(core, {
        action: function action() {},
        dispatch: function dispatch() {}
      });
      redux.handleStateUpdate = jest.fn();
      redux.install();

      expect(redux.handleStateUpdate.mock.calls.length).toEqual(1);
      expect(redux.handleStateUpdate.mock.calls[0]).toEqual([{}, core.state, core.state]);
    });
  });

  describe('uninstall', function () {
    it('should should unsubscribe from uppy events on uninstall', function () {
      var core = {
        emitter: {
          off: jest.fn()
        }
      };

      var redux = new _Redux2.default(core, {
        action: function action() {},
        dispatch: function dispatch() {}
      });
      redux.uninstall();

      expect(core.emitter.off.mock.calls.length).toEqual(1);
      expect(core.emitter.off.mock.calls[0]).toEqual(['core:state-update', redux.handleStateUpdate]);
    });
  });

  describe('handleStateUpdate', function () {
    it('should create a redux action with the new state', function () {
      var core = {};
      var actionMock = jest.fn().mockReturnValue({
        foo: 'bar'
      });
      var dispatchMock = function dispatchMock() {};

      var redux = new _Redux2.default(core, {
        action: actionMock,
        dispatch: dispatchMock
      });
      var prev = { a: 'b' };
      var state = { a: 'b', c: 'd' };
      var patch = { c: 'd' };
      redux.handleStateUpdate(prev, state, patch);
      expect(actionMock.mock.calls.length).toEqual(1);
      expect(actionMock.mock.calls[0]).toEqual([prev, state, patch]);
    });

    it('should dispatch a redux action with the new state', function () {
      var core = {};
      var actionMock = jest.fn().mockReturnValue({
        foo: 'bar'
      });
      var dispatchMock = jest.fn();

      var redux = new _Redux2.default(core, {
        action: actionMock,
        dispatch: dispatchMock
      });
      var prev = { a: 'b' };
      var state = { a: 'b', c: 'd' };
      var patch = { c: 'd' };
      redux.handleStateUpdate(prev, state, patch);
      expect(dispatchMock.mock.calls.length).toEqual(1);
      expect(dispatchMock.mock.calls[0]).toEqual([{ foo: 'bar' }]);
    });
  });
});
//# sourceMappingURL=Redux.test.js.map