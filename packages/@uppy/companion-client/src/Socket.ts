// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore no types
import ee from 'namespace-emitter'

type Opts = {
  autoOpen?: boolean
  target: string
}

export default class UppySocket {
  #queued: Array<{ action: string; payload: unknown }> = []

  #emitter = ee()

  #isOpen = false

  #socket: WebSocket | null

  opts: Opts

  constructor(opts: Opts) {
    this.opts = opts

    if (!opts || opts.autoOpen !== false) {
      this.open()
    }
  }

  get isOpen(): boolean {
    return this.#isOpen
  }

  private [Symbol.for('uppy test: getSocket')](): WebSocket | null {
    return this.#socket
  }

  private [Symbol.for('uppy test: getQueued')](): Array<{
    action: string
    payload: unknown
  }> {
    return this.#queued
  }

  open(): void {
    if (this.#socket != null) return

    this.#socket = new WebSocket(this.opts.target)

    this.#socket.onopen = () => {
      this.#isOpen = true

      while (this.#queued.length > 0 && this.#isOpen) {
        const first = this.#queued.shift()!
        this.send(first.action, first.payload)
      }
    }

    this.#socket.onclose = () => {
      this.#isOpen = false
      this.#socket = null
    }

    this.#socket.onmessage = this.#handleMessage
  }

  close(): void {
    this.#socket?.close()
  }

  send(action: string, payload: unknown): void {
    // attach uuid

    if (!this.#isOpen) {
      this.#queued.push({ action, payload })
      return
    }

    this.#socket!.send(
      JSON.stringify({
        action,
        payload,
      }),
    )
  }

  on(action: string, handler: () => void): void {
    this.#emitter.on(action, handler)
  }

  emit(action: string, payload: unknown): void {
    this.#emitter.emit(action, payload)
  }

  once(action: string, handler: () => void): void {
    this.#emitter.once(action, handler)
  }

  #handleMessage = (e: MessageEvent<any>) => {
    try {
      const message = JSON.parse(e.data)
      this.emit(message.action, message.payload)
    } catch (err) {
      // TODO: use a more robust error handler.
      console.log(err) // eslint-disable-line no-console
    }
  }
}
