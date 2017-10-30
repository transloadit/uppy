'use strict';

var _UppySocket = require('./UppySocket');

var _UppySocket2 = _interopRequireDefault(_UppySocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

describe('core/uppySocket', function () {
  var webSocketConstructorSpy = void 0;
  var webSocketCloseSpy = void 0;
  var webSocketSendSpy = void 0;

  beforeEach(function () {
    webSocketConstructorSpy = jest.fn();
    webSocketCloseSpy = jest.fn();
    webSocketSendSpy = jest.fn();

    global.WebSocket = function () {
      function WebSocket(target) {
        _classCallCheck(this, WebSocket);

        webSocketConstructorSpy(target);
      }

      WebSocket.prototype.close = function close(args) {
        webSocketCloseSpy(args);
      };

      WebSocket.prototype.send = function send(json) {
        webSocketSendSpy(json);
      };

      WebSocket.prototype.triggerOpen = function triggerOpen() {
        this.onopen();
      };

      WebSocket.prototype.triggerClose = function triggerClose() {
        this.onclose();
      };

      return WebSocket;
    }();
  });
  afterEach(function () {
    global.WebSocket = undefined;
  });

  it('should expose a class', function () {
    expect(_UppySocket2.default.name).toEqual('UppySocket');
    expect(new _UppySocket2.default({
      target: 'foo'
    }) instanceof _UppySocket2.default);
  });

  it('should setup a new WebSocket', function () {
    new _UppySocket2.default({ target: 'foo' }); // eslint-disable-line no-new
    expect(webSocketConstructorSpy.mock.calls[0][0]).toEqual('foo');
  });

  it('should send a message via the websocket if the connection is open', function () {
    var uppySocket = new _UppySocket2.default({ target: 'foo' });
    var webSocketInstance = uppySocket.socket;
    webSocketInstance.triggerOpen();

    uppySocket.send('bar', 'boo');
    expect(webSocketSendSpy.mock.calls.length).toEqual(1);
    expect(webSocketSendSpy.mock.calls[0]).toEqual([JSON.stringify({ action: 'bar', payload: 'boo' })]);
  });

  it('should queue the message for the websocket if the connection is not open', function () {
    var uppySocket = new _UppySocket2.default({ target: 'foo' });

    uppySocket.send('bar', 'boo');
    expect(uppySocket.queued).toEqual([{ action: 'bar', payload: 'boo' }]);
    expect(webSocketSendSpy.mock.calls.length).toEqual(0);
  });

  it('should queue any messages for the websocket if the connection is not open, then send them when the connection is open', function () {
    var uppySocket = new _UppySocket2.default({ target: 'foo' });
    var webSocketInstance = uppySocket.socket;

    uppySocket.send('bar', 'boo');
    uppySocket.send('moo', 'baa');
    expect(uppySocket.queued).toEqual([{ action: 'bar', payload: 'boo' }, { action: 'moo', payload: 'baa' }]);
    expect(webSocketSendSpy.mock.calls.length).toEqual(0);

    webSocketInstance.triggerOpen();

    expect(uppySocket.queued).toEqual([]);
    expect(webSocketSendSpy.mock.calls.length).toEqual(2);
    expect(webSocketSendSpy.mock.calls[0]).toEqual([JSON.stringify({ action: 'bar', payload: 'boo' })]);
    expect(webSocketSendSpy.mock.calls[1]).toEqual([JSON.stringify({ action: 'moo', payload: 'baa' })]);
  });

  it('should start queuing any messages when the websocket connection is closed', function () {
    var uppySocket = new _UppySocket2.default({ target: 'foo' });
    var webSocketInstance = uppySocket.socket;
    webSocketInstance.triggerOpen();
    uppySocket.send('bar', 'boo');
    expect(uppySocket.queued).toEqual([]);

    webSocketInstance.triggerClose();
    uppySocket.send('bar', 'boo');
    expect(uppySocket.queued).toEqual([{ action: 'bar', payload: 'boo' }]);
  });

  it('should close the websocket when it is force closed', function () {
    var uppySocket = new _UppySocket2.default({ target: 'foo' });
    var webSocketInstance = uppySocket.socket;
    webSocketInstance.triggerOpen();

    uppySocket.close();
    expect(webSocketCloseSpy.mock.calls.length).toEqual(1);
  });

  it('should be able to subscribe to messages received on the websocket', function () {
    var uppySocket = new _UppySocket2.default({ target: 'foo' });
    var webSocketInstance = uppySocket.socket;

    var emitterListenerMock = jest.fn();
    uppySocket.on('hi', emitterListenerMock);

    webSocketInstance.triggerOpen();
    webSocketInstance.onmessage({
      data: JSON.stringify({ action: 'hi', payload: 'ho' })
    });
    expect(emitterListenerMock.mock.calls).toEqual([['ho', undefined, undefined, undefined, undefined, undefined]]);
  });

  it('should be able to emit messages and subscribe to them', function () {
    var uppySocket = new _UppySocket2.default({ target: 'foo' });

    var emitterListenerMock = jest.fn();
    uppySocket.on('hi', emitterListenerMock);

    uppySocket.emit('hi', 'ho');
    uppySocket.emit('hi', 'ho');
    uppySocket.emit('hi', 'off to work we go');

    expect(emitterListenerMock.mock.calls).toEqual([['ho', undefined, undefined, undefined, undefined, undefined], ['ho', undefined, undefined, undefined, undefined, undefined], ['off to work we go', undefined, undefined, undefined, undefined, undefined]]);
  });

  it('should be able to subscribe to the first event for a particular action', function () {
    var uppySocket = new _UppySocket2.default({ target: 'foo' });

    var emitterListenerMock = jest.fn();
    uppySocket.once('hi', emitterListenerMock);

    uppySocket.emit('hi', 'ho');
    uppySocket.emit('hi', 'ho');
    uppySocket.emit('hi', 'off to work we go');

    expect(emitterListenerMock.mock.calls.length).toEqual(1);
    expect(emitterListenerMock.mock.calls).toEqual([['ho', undefined, undefined, undefined, undefined, undefined]]);
  });
});
//# sourceMappingURL=UppySocket.test.js.map