const ee = require('namespace-emitter')

module.exports = class UppySocket {
  constructor (opts) {
    this.opts = opts
    this._queued = []
    this.isOpen = false
    this.emitter = ee()

    this._handleMessage = this._handleMessage.bind(this)

    this.close = this.close.bind(this)
    this.emit = this.emit.bind(this)
    this.on = this.on.bind(this)
    this.once = this.once.bind(this)
    this.send = this.send.bind(this)

    if (!opts || opts.autoOpen !== false) {
      this.open()
    }
  }

  open () {
    this.socket = new WebSocket(this.opts.target)

    this.socket.onopen = (e) => {
      this.isOpen = true

      while (this._queued.length > 0 && this.isOpen) {
        const first = this._queued[0]
        this.send(first.action, first.payload)
        this._queued = this._queued.slice(1)
      }
    }

    this.socket.onclose = (e) => {
      this.isOpen = false
    }

    this.socket.onmessage = this._handleMessage
  }

  close () {
    if (this.socket) {
      this.socket.close()
    }
  }

  send (action, payload) {
    // attach uuid

    if (!this.isOpen) {
      this._queued.push({ action, payload })
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
