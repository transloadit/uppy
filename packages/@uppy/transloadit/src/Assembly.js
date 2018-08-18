const io = require('socket.io-client')
const Emitter = require('component-emitter')
const parseUrl = require('url-parse')

const ASSEMBLY_UPLOADING = 'ASSEMBLY_UPLOADING'
const ASSEMBLY_EXECUTING = 'ASSEMBLY_EXECUTING'
const ASSEMBLY_FINISHED = 'ASSEMBLY_FINISHED'

const statusOrder = [
  ASSEMBLY_UPLOADING,
  ASSEMBLY_EXECUTING,
  ASSEMBLY_FINISHED
]

/**
 * Check that an assembly status is equal to or larger
 * than some desired status.
 * It checks for things that are larger so that a comparison like this works, when the old assembly status is UPLOADING but the new is FINISHED:
 *
 * !isStatus(oldStatus, ASSEMBLY_EXECUTING) && isStatus(newState, ASSEMBLY_EXECUTING)
 *
 * …so that we can emit the 'executing' event even if the execution step was so fast that we missed it.
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

    this.on('finished', () => {
      this.close()
    })
  }

  connect () {
    this._connectSocket()
    this._beginPolling()
  }

  _connectSocket () {
    const parsed = parseUrl(this.status.websocket_url)
    const socket = io.connect(parsed.origin, {
      path: parsed.pathname
    })

    socket.on('connect', () => {
      socket.emit('assembly_connect', {
        id: this.assembly.assembly_id
      })

      this.emit('connect')
    })
    socket.on('error', () => {
      socket.disconnect()
      this.socket = null
    })

    socket.on('assembly_finished', () => {
      this.emit('finished')
    })

    socket.on('assembly_upload_finished', (file) => {
      this.emit('upload', file)
    })

    socket.on('assembly_uploading_finished', () => {
      this.emit('executing')
    })

    socket.on('assembly_upload_meta_data_extracted', () => {
      this.emit('metadata')
    })

    socket.on('assembly_result_finished', (stepName, result) => {
      this.emit('result', stepName, result)
    })

    socket.on('assembly_error', (err) => {
      this._onError(err)
    })

    this.socket = socket
  }

  _onError (err) {
    this.emit('error', Object.assign(new Error(err.message), err))
  }

  /**
   * Begin polling for assembly status changes.
   * This sends a request to the assembly status endpoint every so often,
   * if the socket is not connected. If the socket connection fails or
   * takes a long time, we won't miss any events.
   */
  _beginPolling () {
    this.pollInterval = setInterval(() => {
      if (!this.socket.connected) {
        this._fetchStatus()
      }
    }, 2000)
  }

  /**
   * Reload assembly status.
   * Useful if the socket doesn't work.
   */
  _fetchStatus () {
    return fetch(this.status.assembly_url)
      .then((response) => response.json())
      .then((status) => {
        // Avoid updating if we closed during this request's lifetime.
        if (this.closed) return
        this.updateStatus(status)
      })
  }

  /**
   * Update this assembly's status with a full new
   * object. Events will be emitted for status changes,
   * new files, and new results.
   *
   * @param {Object} next The new assembly status object.
   */
  updateStatus (next) {
    this._diffStatus(this.status, next)
    this.status = next
  }

  /**
   * Diff two assembly statuses, and emit the events
   * necessary to go from `prev` to `next`.
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
    // The below checks run in this order, that way
    // even if we jump from UPLOADING straight to
    // FINISHED all the events are emitted as expected.

    const nowExecuting =
      isStatus(nextStatus, ASSEMBLY_EXECUTING) &&
      !isStatus(prevStatus, ASSEMBLY_EXECUTING)
    if (nowExecuting) {
      // Without WebSockets, this is our only way to tell if uploading finished.
      // Hence, we emit this just before the 'upload's and before the 'metadata' event
      // for the most intuitive ordering, corresponding to the _usual_ ordering
      // (if not guaranteed) that you'd get on the WebSocket.
      this.emit('executing')
    }

    // Find new uploaded files.
    Object.keys(next.files)
      .filter((upload) => (
        !prev.files.hasOwnProperty(upload)
      ))
      .map((upload) => next.files[upload])
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

    if (isStatus(nextStatus, ASSEMBLY_FINISHED) &&
        !isStatus(prevStatus, ASSEMBLY_FINISHED)) {
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
