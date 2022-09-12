import Emitter from 'component-emitter'
import { io } from 'socket.io-client'
import has from '@uppy/utils/lib/hasProperty'
import NetworkError from '@uppy/utils/lib/NetworkError'
import fetchWithNetworkError from '@uppy/utils/lib/fetchWithNetworkError'
import parseUrl from './parseUrl.js'

const ASSEMBLY_UPLOADING = 'ASSEMBLY_UPLOADING'
const ASSEMBLY_EXECUTING = 'ASSEMBLY_EXECUTING'
const ASSEMBLY_COMPLETED = 'ASSEMBLY_COMPLETED'

const statusOrder = [
  ASSEMBLY_UPLOADING,
  ASSEMBLY_EXECUTING,
  ASSEMBLY_COMPLETED,
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
  #rateLimitedQueue

  #fetchWithNetworkError

  #previousFetchStatusStillPending = false

  #sse

  constructor (assembly, rateLimitedQueue) {
    super()

    // The current assembly status.
    this.status = assembly
    // The socket.io connection.
    this.socket = null
    // The interval timer for full status updates.
    this.pollInterval = null
    // Whether this assembly has been closed (finished or errored)
    this.closed = false

    this.#rateLimitedQueue = rateLimitedQueue
    this.#fetchWithNetworkError = rateLimitedQueue.wrapPromiseFunction(fetchWithNetworkError)
  }

  connect () {
    this.#connectServerEvent()
    this.#connectSocket()
    this.#beginPolling()
  }

  #onFinished () {
    this.emit('finished')
    this.close()
  }

  #connectServerEvent () {
    this.#sse = new EventSource(this.status.assembly_ssl_url)

    this.#sse.addEventListener('open', () => {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
      clearInterval(this.pollInterval)
      this.pollInterval = null
    })

    /*
     * This will listen only for events
     * similar to the following:
     *
     * event: notice
     * data: useful data
     * id: someid
     */
    this.#sse.addEventListener('notice', (e) => {
      console.log(e.data)
    })

    /*
     * Similarly, this will listen for events
     * with the field event: update
     */
    this.#sse.addEventListener('update', (e) => {
      console.log(e.data)
    })

    /*
     * The event "message" is a special case, as it
     * will capture events without an event field
     * as well as events that have the specific type
     * other event type.
     */
    this.#sse.addEventListener('message', (e) => {
      console.log(e.data)
    })
  }

  #connectSocket () {
    const parsed = parseUrl(this.status.websocket_url)
    const socket = io(parsed.origin, {
      transports: ['websocket'],
      path: parsed.pathname,
    })

    socket.on('connect', () => {
      socket.emit('assembly_connect', {
        id: this.status.assembly_id,
      })

      this.emit('connect')
    })

    socket.on('connect_error', () => {
      socket.disconnect()
      this.socket = null
    })

    socket.on('assembly_finished', () => {
      this.#onFinished()
    })

    socket.on('assembly_upload_finished', (file) => {
      this.emit('upload', file)
      this.status.uploads.push(file)
    })

    socket.on('assembly_uploading_finished', () => {
      this.emit('executing')
    })

    socket.on('assembly_upload_meta_data_extracted', () => {
      this.emit('metadata')
      this.#fetchStatus({ diff: false })
    })

    socket.on('assembly_result_finished', (stepName, result) => {
      this.emit('result', stepName, result)
      if (!this.status.results[stepName]) {
        this.status.results[stepName] = []
      }
      this.status.results[stepName].push(result)
    })

    socket.on('assembly_error', (err) => {
      this.#onError(err)
      // Refetch for updated status code
      this.#fetchStatus({ diff: false })
    })

    this.socket = socket
  }

  #onError (err) {
    this.emit('error', Object.assign(new Error(err.message), err))
    this.close()
  }

  /**
   * Begin polling for assembly status changes. This sends a request to the
   * assembly status endpoint every so often, if the socket is not connected.
   * If the socket connection fails or takes a long time, we won't miss any
   * events.
   */
  #beginPolling () {
    this.pollInterval = setInterval(() => {
      if (!this.socket || !this.socket.connected) {
        this.#fetchStatus()
      }
    }, 2000)
  }

  /**
   * Reload assembly status. Useful if the socket doesn't work.
   *
   * Pass `diff: false` to avoid emitting diff events, instead only emitting
   * 'status'.
   */
  async #fetchStatus ({ diff = true } = {}) {
    if (this.closed || this.#rateLimitedQueue.isPaused || this.#previousFetchStatusStillPending) return

    try {
      this.#previousFetchStatusStillPending = true
      const response = await this.#fetchWithNetworkError(this.status.assembly_ssl_url)
      this.#previousFetchStatusStillPending = false

      if (this.closed) return

      if (response.status === 429) {
        this.#rateLimitedQueue.rateLimit(2_000)
        return
      }

      if (!response.ok) {
        this.#onError(new NetworkError(response.statusText))
        return
      }

      const status = await response.json()
      // Avoid updating if we closed during this request's lifetime.
      if (this.closed) return
      this.emit('status', status)

      if (diff) {
        this.updateStatus(status)
      } else {
        this.status = status
      }
    } catch (err) {
      this.#onError(err)
    }
  }

  update () {
    return this.#fetchStatus({ diff: true })
  }

  /**
   * Update this assembly's status with a full new object. Events will be
   * emitted for status changes, new files, and new results.
   *
   * @param {object} next The new assembly status object.
   */
  updateStatus (next) {
    this.#diffStatus(this.status, next)
    this.status = next
  }

  /**
   * Diff two assembly statuses, and emit the events necessary to go from `prev`
   * to `next`.
   *
   * @param {object} prev The previous assembly status.
   * @param {object} next The new assembly status.
   */
  #diffStatus (prev, next) {
    const prevStatus = prev.ok
    const nextStatus = next.ok

    if (next.error && !prev.error) {
      return this.#onError(next)
    }

    // Desired emit order:
    //  - executing
    //  - (n × upload)
    //  - metadata
    //  - (m × result)
    //  - finished
    // The below checks run in this order, that way even if we jump from
    // UPLOADING straight to FINISHED all the events are emitted as expected.

    const nowExecuting = isStatus(nextStatus, ASSEMBLY_EXECUTING)
      && !isStatus(prevStatus, ASSEMBLY_EXECUTING)
    if (nowExecuting) {
      // Without WebSockets, this is our only way to tell if uploading finished.
      // Hence, we emit this just before the 'upload's and before the 'metadata'
      // event for the most intuitive ordering, corresponding to the _usual_
      // ordering (if not guaranteed) that you'd get on the WebSocket.
      this.emit('executing')
    }

    // Find new uploaded files.
    Object.keys(next.uploads)
      .filter((upload) => !has(prev.uploads, upload))
      .forEach((upload) => {
        this.emit('upload', next.uploads[upload])
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

    if (isStatus(nextStatus, ASSEMBLY_COMPLETED)
        && !isStatus(prevStatus, ASSEMBLY_COMPLETED)) {
      this.emit('finished')
    }

    return undefined
  }

  /**
   * Stop updating this assembly.
   */
  close () {
    this.closed = true
    if (this.#sse) {
      this.#sse.close()
      this.#sse = null
    }
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    clearInterval(this.pollInterval)
    this.pollInterval = null
  }
}

export default TransloaditAssembly
