/**
 * A small AbortController ponyfill. We don't need it do do much, so…
 */

const emitter = require('namespace-emitter')

function createAbortEvent () {
  try {
    return new Event('abort')
  } catch {
    // For Internet Explorer
    const event = document.createEvent('Event')
    event.initEvent('abort', false, false)
    return event
  }
}

function createAbortError () {
  try {
    return new DOMException('Aborted', 'AbortError')
  } catch {
    // For Internet Explorer
    const error = new Error('Aborted')
    error.name = 'AbortError'
    return error
  }
}

class AbortSignalPolyfill {
  constructor () {
    this._emitter = emitter()
    this.aborted = false
  }

  _abort () {
    this._emitter.emit('abort', createAbortEvent())
    this.aborted = true
  }

  addEventListener (event, callback) {
    this._emitter.on(event, callback)
  }

  removeEventListener (event, callback) {
    this._emitter.off(event, callback)
  }
}

class AbortControllerPolyfill {
  constructor () {
    this.signal = new AbortSignalPolyfill()
  }

  abort () {
    this.signal._abort()
  }
}

const AbortSignal = (typeof window !== 'undefined' && window.AbortSignal) || AbortSignalPolyfill
const AbortController = (typeof window !== 'undefined' && window.AbortController) || AbortControllerPolyfill

exports.AbortController = AbortController
exports.AbortSignal = AbortSignal
exports.createAbortError = createAbortError
