const io = requireSocketIo
const Emitter = require('component-emitter')
const parseUrl = require('./parseUrl')

// Lazy load socket.io to avoid a console error
// in IE 10 when the Transloadit plugin is not used.
// (The console.error call comes from `buffer`. I
// think we actually don't use that part of socket.io
// at all…)
let socketIo
function requireSocketIo () {
  if (!socketIo) {
    socketIo = require('socket.io-client')
  }
  return socketIo
}

const ASSEMBLY_UPLOADING = 'ASSEMBLY_UPLOADING'
const ASSEMBLY_EXECUTING = 'ASSEMBLY_EXECUTING'
const ASSEMBLY_COMPLETED = 'ASSEMBLY_COMPLETED'

const statusOrder = [
  ASSEMBLY_UPLOADING,
  ASSEMBLY_EXECUTING,
  ASSEMBLY_COMPLETED
]

/**
 * Check that an assembly status is equal to or larger than some desired status.
 * It checks for things that are larger so that a comparison like this works,
 * when the old assembly status is UPLOADING but the new is FINISHED:
 *
 * !isStatus(oldStatus, ASSEMBLY_EXECUTING) && isStatus(newState, ASSEMBLY_EXECUTING)
 *
 * …so that we can emit the 'executing' event even if the execution step was so
 * fast that we missed it.
 */
function isStatus (status, test) {
  return statusOrder.indexOf(status) >= statusOrder.indexOf(test)
}

class TransloaditAssembly extends Emitter {
  constructor (assembly) {
    super()

    // The current assembly status.
    this.status = assembly
    // The socket.io connection.
    this.socket = null
    // The interval timer for full status updates.
    this.pollInterval = null
    // Whether this assembly has been closed (finished or errored)
    this.closed = false
  }

  connect () {
    this._connectSocket()
    this._beginPolling()
  }

  _onFinished () {
    this.emit('finished')
    this.close()
  }

  _connectSocket () {
    const parsed = parseUrl(this.status.websocket_url)
    const socket = io().connect(parsed.origin, {
      transports: ['websocket'],
      path: parsed.pathname
    })

    socket.on('connect', () => {
      socket.emit('assembly_connect', {
        id: this.status.assembly_id
      })

      this.emit('connect')
    })
    socket.on('error', () => {
      socket.disconnect()
      this.socket = null
    })

    socket.on('assembly_finished', () => {
      this._onFinished()
    })

    socket.on('assembly_upload_finished', (file) => {
      this.emit('upload', file)
      this._fetchStatus({ diff: false })
    })

    socket.on('assembly_uploading_finished', () => {
      this.emit('executing')
      this._fetchStatus({ diff: false })
    })

    socket.on('assembly_upload_meta_data_extracted', () => {
      this.emit('metadata')
      this._fetchStatus({ diff: false })
    })

    socket.on('assembly_result_finished', (stepName, result) => {
      this.emit('result', stepName, result)
      this._fetchStatus({ diff: false })
    })

    socket.on('assembly_error', (err) => {
      this._onError(err)
      this._fetchStatus({ diff: false })
    })

    this.socket = socket
  }

  _onError (err) {
    this.emit('error', Object.assign(new Error(err.message), err))
  }

  /**
   * Begin polling for assembly status changes. This sends a request to the
   * assembly status endpoint every so often, if the socket is not connected.
   * If the socket connection fails or takes a long time, we won't miss any
   * events.
   */
  _beginPolling () {
    this.pollInterval = setInterval(() => {
      if (!this.socket || !this.socket.connected) {
        this._fetchStatus()
      }
    }, 2000)
  }

  /**
   * Reload assembly status. Useful if the socket doesn't work.
   *
   * Pass `diff: false` to avoid emitting diff events, instead only emitting
   * 'status'.
   */
  _fetchStatus ({ diff = true } = {}) {
    return fetch(this.status.assembly_ssl_url)
      .then((response) => response.json())
      .then((status) => {
        // Avoid updating if we closed during this request's lifetime.
        if (this.closed) return
        this.emit('status', status)

        if (diff) {
          this.updateStatus(status)
        } else {
          this.status = status
        }
      })
  }

  update () {
    return this._fetchStatus({ diff: true })
  }

  /**
   * Update this assembly's status with a full new object. Events will be
   * emitted for status changes, new files, and new results.
   *
   * @param {Object} next The new assembly status object.
   */
  updateStatus (next) {
    this._diffStatus(this.status, next)
    this.status = next
  }

  /**
   * Diff two assembly statuses, and emit the events necessary to go from `prev`
   * to `next`.
   *
   * @param {Object} prev The previous assembly status.
   * @param {Object} next The new assembly status.
   */
  _diffStatus (prev, next) {
    const prevStatus = prev.ok
    const nextStatus = next.ok

    if (next.error && !prev.error) {
      return this._onError(next)
    }

    // Desired emit order:
    //  - executing
    //  - (n × upload)
    //  - metadata
    //  - (m × result)
    //  - finished
    // The below checks run in this order, that way even if we jump from
    // UPLOADING straight to FINISHED all the events are emitted as expected.

    const nowExecuting =
      isStatus(nextStatus, ASSEMBLY_EXECUTING) &&
      !isStatus(prevStatus, ASSEMBLY_EXECUTING)
    if (nowExecuting) {
      // Without WebSockets, this is our only way to tell if uploading finished.
      // Hence, we emit this just before the 'upload's and before the 'metadata'
      // event for the most intuitive ordering, corresponding to the _usual_
      // ordering (if not guaranteed) that you'd get on the WebSocket.
      this.emit('executing')
    }

    // Find new uploaded files.
    Object.keys(next.uploads)
      .filter((upload) => (
        !prev.uploads.hasOwnProperty(upload)
      ))
      .map((upload) => next.uploads[upload])
      .forEach((upload) => {
        this.emit('upload', upload)
      })

    if (nowExecuting) {
      this.emit('metadata')
    }

    // Find new results.
    Object.keys(next.results).forEach((stepName) => {
      const nextResults = next.results[stepName]
      const prevResults = prev.results[stepName]

      nextResults
        .filter((n) => !prevResults || !prevResults.some((p) => p.id === n.id))
        .forEach((result) => {
          this.emit('result', stepName, result)
        })
    })

    if (isStatus(nextStatus, ASSEMBLY_COMPLETED) &&
        !isStatus(prevStatus, ASSEMBLY_COMPLETED)) {
      this.emit('finished')
    }
  }

  /**
   * Stop updating this assembly.
   */
  close () {
    this.closed = true
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    clearInterval(this.pollInterval)
  }
}

module.exports = TransloaditAssembly
