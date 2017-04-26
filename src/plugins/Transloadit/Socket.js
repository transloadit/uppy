const io = require('socket.io-client')
const Emitter = require('namespace-emitter')
const parseUrl = require('url-parse')

/**
 * WebSocket status API client for Transloadit.
 */
module.exports = class TransloaditSocket {
  constructor (url, assembly) {
    const emitter = Emitter()
    this.on = emitter.on.bind(emitter)
    this.off = emitter.off.bind(emitter)
    this.emit = emitter.emit.bind(emitter)

    const parsed = parseUrl(url)

    this.assembly = assembly
    this.socket = io.connect(parsed.origin, {
      path: parsed.pathname
    })

    this.attachDefaultHandlers()
  }

  attachDefaultHandlers () {
    this.socket.on('connect', () => {
      this.socket.emit('assembly_connect', {
        id: this.assembly.assembly_id
      })

      this.emit('connect')
    })

    this.socket.on('assembly_finished', () => {
      this.emit('finished')

      this.close()
    })

    this.socket.on('assembly_upload_meta_data_extracted', () => {
      this.emit('metadata')
    })

    this.socket.on('assembly_result_finished', (stepName, result) => {
      this.emit('result', stepName, result)
    })
  }

  close () {
    this.socket.disconnect()
  }
}
