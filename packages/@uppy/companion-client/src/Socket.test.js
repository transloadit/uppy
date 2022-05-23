import { afterEach, beforeEach, jest, describe, it, expect } from '@jest/globals'
import UppySocket from './Socket.js'

describe('Socket', () => {
  let webSocketConstructorSpy
  let webSocketCloseSpy
  let webSocketSendSpy

  beforeEach(() => {
    webSocketConstructorSpy = jest.fn()
    webSocketCloseSpy = jest.fn()
    webSocketSendSpy = jest.fn()

    globalThis.WebSocket = class WebSocket {
      constructor (target) {
        webSocketConstructorSpy(target)
      }

      // eslint-disable-next-line class-methods-use-this
      close (args) {
        webSocketCloseSpy(args)
      }

      // eslint-disable-next-line class-methods-use-this
      send (json) {
        webSocketSendSpy(json)
      }

      triggerOpen () {
        this.onopen()
      }

      triggerClose () {
        this.onclose()
      }
    }
  })
  afterEach(() => {
    globalThis.WebSocket = undefined
  })

  it('should expose a class', () => {
    expect(UppySocket.name).toEqual('UppySocket')
    expect(
      new UppySocket({
        target: 'foo',
      }) instanceof UppySocket,
    )
  })

  it('should setup a new WebSocket', () => {
    new UppySocket({ target: 'foo' }) // eslint-disable-line no-new
    expect(webSocketConstructorSpy.mock.calls[0][0]).toEqual('foo')
  })

  it('should send a message via the websocket if the connection is open', () => {
    const uppySocket = new UppySocket({ target: 'foo' })
    const webSocketInstance = uppySocket[Symbol.for('uppy test: getSocket')]()
    webSocketInstance.triggerOpen()

    uppySocket.send('bar', 'boo')
    expect(webSocketSendSpy.mock.calls.length).toEqual(1)
    expect(webSocketSendSpy.mock.calls[0]).toEqual([
      JSON.stringify({ action: 'bar', payload: 'boo' }),
    ])
  })

  it('should queue the message for the websocket if the connection is not open', () => {
    const uppySocket = new UppySocket({ target: 'foo' })

    uppySocket.send('bar', 'boo')
    expect(uppySocket[Symbol.for('uppy test: getQueued')]()).toEqual([{ action: 'bar', payload: 'boo' }])
    expect(webSocketSendSpy.mock.calls.length).toEqual(0)
  })

  it('should queue any messages for the websocket if the connection is not open, then send them when the connection is open', () => {
    const uppySocket = new UppySocket({ target: 'foo' })
    const webSocketInstance = uppySocket[Symbol.for('uppy test: getSocket')]()

    uppySocket.send('bar', 'boo')
    uppySocket.send('moo', 'baa')
    expect(uppySocket[Symbol.for('uppy test: getQueued')]()).toEqual([
      { action: 'bar', payload: 'boo' },
      { action: 'moo', payload: 'baa' },
    ])
    expect(webSocketSendSpy.mock.calls.length).toEqual(0)

    webSocketInstance.triggerOpen()

    expect(uppySocket[Symbol.for('uppy test: getQueued')]()).toEqual([])
    expect(webSocketSendSpy.mock.calls.length).toEqual(2)
    expect(webSocketSendSpy.mock.calls[0]).toEqual([
      JSON.stringify({ action: 'bar', payload: 'boo' }),
    ])
    expect(webSocketSendSpy.mock.calls[1]).toEqual([
      JSON.stringify({ action: 'moo', payload: 'baa' }),
    ])
  })

  it('should start queuing any messages when the websocket connection is closed', () => {
    const uppySocket = new UppySocket({ target: 'foo' })
    const webSocketInstance = uppySocket[Symbol.for('uppy test: getSocket')]()
    webSocketInstance.triggerOpen()
    uppySocket.send('bar', 'boo')
    expect(uppySocket[Symbol.for('uppy test: getQueued')]()).toEqual([])

    webSocketInstance.triggerClose()
    uppySocket.send('bar', 'boo')
    expect(uppySocket[Symbol.for('uppy test: getQueued')]()).toEqual([{ action: 'bar', payload: 'boo' }])
  })

  it('should close the websocket when it is force closed', () => {
    const uppySocket = new UppySocket({ target: 'foo' })
    const webSocketInstance = uppySocket[Symbol.for('uppy test: getSocket')]()
    webSocketInstance.triggerOpen()

    uppySocket.close()
    expect(webSocketCloseSpy.mock.calls.length).toEqual(1)
  })

  it('should be able to subscribe to messages received on the websocket', () => {
    const uppySocket = new UppySocket({ target: 'foo' })
    const webSocketInstance = uppySocket[Symbol.for('uppy test: getSocket')]()

    const emitterListenerMock = jest.fn()
    uppySocket.on('hi', emitterListenerMock)

    webSocketInstance.triggerOpen()
    webSocketInstance.onmessage({
      data: JSON.stringify({ action: 'hi', payload: 'ho' }),
    })
    expect(emitterListenerMock.mock.calls).toEqual([
      ['ho', undefined, undefined, undefined, undefined, undefined],
    ])
  })

  it('should be able to emit messages and subscribe to them', () => {
    const uppySocket = new UppySocket({ target: 'foo' })

    const emitterListenerMock = jest.fn()
    uppySocket.on('hi', emitterListenerMock)

    uppySocket.emit('hi', 'ho')
    uppySocket.emit('hi', 'ho')
    uppySocket.emit('hi', 'off to work we go')

    expect(emitterListenerMock.mock.calls).toEqual([
      ['ho', undefined, undefined, undefined, undefined, undefined],
      ['ho', undefined, undefined, undefined, undefined, undefined],
      [
        'off to work we go',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ],
    ])
  })

  it('should be able to subscribe to the first event for a particular action', () => {
    const uppySocket = new UppySocket({ target: 'foo' })

    const emitterListenerMock = jest.fn()
    uppySocket.once('hi', emitterListenerMock)

    uppySocket.emit('hi', 'ho')
    uppySocket.emit('hi', 'ho')
    uppySocket.emit('hi', 'off to work we go')

    expect(emitterListenerMock.mock.calls.length).toEqual(1)
    expect(emitterListenerMock.mock.calls).toEqual([
      ['ho', undefined, undefined, undefined, undefined, undefined],
    ])
  })
})
