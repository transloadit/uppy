const ee = require('namespace-emitter')

module.exports = class UppySocket {
  constructor (opts) {
    this.queued = []
    this.isOpen = false
    this.socket = new WebSocket(opts.target)
    this.emitter = ee()

    this.socket.onopen = (e) => {
      this.isOpen = true

      while (this.queued.length > 0 && this.isOpen) {
        const first = this.queued[0]
        this.send(first.action, first.payload)
        this.queued = this.queued.slice(1)
      }
    }

    this.socket.onclose = (e) => {
      this.isOpen = false
    }

    this._handleMessage = this._handleMessage.bind(this)

    this.socket.onmessage = this._handleMessage

    this.close = this.close.bind(this)
    this.emit = this.emit.bind(this)
    this.on = this.on.bind(this)
    this.once = this.once.bind(this)
    this.send = this.send.bind(this)
  }

  close () {
    return this.socket.close()
  }

  send (action, payload) {
    // attach uuid

    if (!this.isOpen) {
      this.queued.push({action, payload})
      return
    }

    this.socket.send(JSON.stringify({
      action,
      payload
    }))
  }

  on (action, handler) {
    this.emitter.on(action, handler)
  }

  emit (action, payload) {
    this.emitter.emit(action, payload)
  }

  once (action, handler) {
    this.emitter.once(action, handler)
  }

  _handleMessage (e) {
    try {
      const message = JSON.parse(e.data)
      this.emit(message.action, message.payload)
    } catch (err) {
      console.log(err)
    }
  }
}
