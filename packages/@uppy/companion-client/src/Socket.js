import ee from 'namespace-emitter'

export default class UppySocket {
  #queued = []

  #emitter = ee()

  #isOpen = false

  #socket

  constructor (opts) {
    this.opts = opts

    if (!opts || opts.autoOpen !== false) {
      this.open()
    }
  }

  get isOpen () { return this.#isOpen }

  [Symbol.for('uppy test: getSocket')] () { return this.#socket }

  [Symbol.for('uppy test: getQueued')] () { return this.#queued }

  open () {
    this.#socket = new WebSocket(this.opts.target)

    this.#socket.onopen = () => {
      this.#isOpen = true

      while (this.#queued.length > 0 && this.#isOpen) {
        const first = this.#queued.shift()
        this.send(first.action, first.payload)
      }
    }

    this.#socket.onclose = () => {
      this.#isOpen = false
    }

    this.#socket.onmessage = this.#handleMessage
  }

  close () {
    this.#socket?.close()
  }

  send (action, payload) {
    // attach uuid

    if (!this.#isOpen) {
      this.#queued.push({ action, payload })
      return
    }

    this.#socket.send(JSON.stringify({
      action,
      payload,
    }))
  }

  on (action, handler) {
    this.#emitter.on(action, handler)
  }

  emit (action, payload) {
    this.#emitter.emit(action, payload)
  }

  once (action, handler) {
    this.#emitter.once(action, handler)
  }

  #handleMessage = (e) => {
    try {
      const message = JSON.parse(e.data)
      this.emit(message.action, message.payload)
    } catch (err) {
      // TODO: use a more robust error handler.
      console.log(err) // eslint-disable-line no-console
    }
  }
}
