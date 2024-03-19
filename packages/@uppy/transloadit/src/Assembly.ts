import Emitter from 'component-emitter'
import has from '@uppy/utils/lib/hasProperty'
import NetworkError from '@uppy/utils/lib/NetworkError'
import fetchWithNetworkError from '@uppy/utils/lib/fetchWithNetworkError'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import type {
  RateLimitedQueue,
  WrapPromiseFunctionType,
} from '@uppy/utils/lib/RateLimitedQueue'
import type { AssemblyResponse } from '.'

const ASSEMBLY_UPLOADING = 'ASSEMBLY_UPLOADING'
const ASSEMBLY_EXECUTING = 'ASSEMBLY_EXECUTING'
const ASSEMBLY_COMPLETED = 'ASSEMBLY_COMPLETED'

const statusOrder = [ASSEMBLY_UPLOADING, ASSEMBLY_EXECUTING, ASSEMBLY_COMPLETED]

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
function isStatus(status: string, test: string) {
  return statusOrder.indexOf(status) >= statusOrder.indexOf(test)
}

class TransloaditAssembly extends Emitter {
  #rateLimitedQueue: RateLimitedQueue

  #fetchWithNetworkError: WrapPromiseFunctionType<typeof fetchWithNetworkError>

  #previousFetchStatusStillPending = false

  #sse: EventSource | null

  status: AssemblyResponse

  pollInterval: ReturnType<typeof setInterval> | null

  closed: boolean

  constructor(assembly: AssemblyResponse, rateLimitedQueue: RateLimitedQueue) {
    super()

    // The current assembly status.
    this.status = assembly
    // The interval timer for full status updates.
    this.pollInterval = null
    // Whether this assembly has been closed (finished or errored)
    this.closed = false

    this.#rateLimitedQueue = rateLimitedQueue
    this.#fetchWithNetworkError = rateLimitedQueue.wrapPromiseFunction(
      fetchWithNetworkError,
    )
  }

  connect(): void {
    this.#connectServerSentEvents()
    this.#beginPolling()
  }

  #onFinished() {
    this.emit('finished')
    this.close()
  }

  #connectServerSentEvents() {
    this.#sse = new EventSource(
      `${this.status.websocket_url}?assembly=${this.status.assembly_id}`,
    )

    this.#sse.addEventListener('open', () => {
      clearInterval(this.pollInterval!)
      this.pollInterval = null
    })

    /*
     * The event "message" is a special case, as it
     * will capture events without an event field
     * as well as events that have the specific type
     * other event type.
     */
    this.#sse.addEventListener('message', (e) => {
      if (e.data === 'assembly_finished') {
        this.#onFinished()
      }

      if (e.data === 'assembly_uploading_finished') {
        this.emit('executing')
      }

      if (e.data === 'assembly_upload_meta_data_extracted') {
        this.emit('metadata')
        this.#fetchStatus({ diff: false })
      }
    })

    this.#sse.addEventListener('assembly_upload_finished', (e) => {
      const file = JSON.parse(e.data)
      this.emit('upload', file)
      this.status.uploads.push(file)
    })

    this.#sse.addEventListener('assembly_result_finished', (e) => {
      const [stepName, result] = JSON.parse(e.data)
      this.emit('result', stepName, result)
      ;(this.status.results[stepName] ??= []).push(result)
    })

    this.#sse.addEventListener('assembly_execution_progress', (e) => {
      const details = JSON.parse(e.data)
      this.emit('execution-progress', details)
    })

    this.#sse.addEventListener('assembly_error', (e) => {
      try {
        this.#onError(JSON.parse(e.data))
      } catch {
        this.#onError(new Error(e.data))
      }
      // Refetch for updated status code
      this.#fetchStatus({ diff: false })
    })
  }

  #onError(assemblyOrError: AssemblyResponse | NetworkError | Error) {
    this.emit(
      'error',
      Object.assign(new Error(assemblyOrError.message), assemblyOrError),
    )
    this.close()
  }

  /**
   * Begin polling for assembly status changes. This sends a request to the
   * assembly status endpoint every so often, if SSE connection failed.
   * If the SSE connection fails or takes a long time, we won't miss any
   * events.
   */
  #beginPolling() {
    this.pollInterval = setInterval(() => {
      this.#fetchStatus()
    }, 2000)
  }

  /**
   * Reload assembly status. Useful if SSE doesn't work.
   *
   * Pass `diff: false` to avoid emitting diff events, instead only emitting
   * 'status'.
   */
  async #fetchStatus({ diff = true } = {}) {
    if (
      this.closed ||
      this.#rateLimitedQueue.isPaused ||
      this.#previousFetchStatusStillPending
    )
      return

    try {
      this.#previousFetchStatusStillPending = true
      const response = await this.#fetchWithNetworkError(
        this.status.assembly_ssl_url,
      )
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

  update(): Promise<void> {
    return this.#fetchStatus({ diff: true })
  }

  /**
   * Update this assembly's status with a full new object. Events will be
   * emitted for status changes, new files, and new results.
   */
  updateStatus(next: AssemblyResponse): void {
    this.#diffStatus(this.status, next)
    this.status = next
  }

  /**
   * Diff two assembly statuses, and emit the events necessary to go from `prev`
   * to `next`.
   */
  #diffStatus(prev: AssemblyResponse, next: AssemblyResponse) {
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

    const nowExecuting =
      isStatus(nextStatus, ASSEMBLY_EXECUTING) &&
      !isStatus(prevStatus, ASSEMBLY_EXECUTING)
    if (nowExecuting) {
      // Without SSE, this is our only way to tell if uploading finished.
      // Hence, we emit this just before the 'upload's and before the 'metadata'
      // event for the most intuitive ordering, corresponding to the _usual_
      // ordering (if not guaranteed) that you'd get on SSE.
      this.emit('executing')
    }

    // Only emit if the upload is new (not in prev.uploads).
    Object.keys(next.uploads)
      .filter((upload) => !has(prev.uploads, upload))
      .forEach((upload) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore either the types are wrong or the tests are wrong.
        // types think next.uploads is an array, but the tests pass an object.
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

    if (
      isStatus(nextStatus, ASSEMBLY_COMPLETED) &&
      !isStatus(prevStatus, ASSEMBLY_COMPLETED)
    ) {
      this.emit('finished')
    }

    return undefined
  }

  /**
   * Stop updating this assembly.
   */
  close(): void {
    this.closed = true
    if (this.#sse) {
      this.#sse.close()
      this.#sse = null
    }
    clearInterval(this.pollInterval!)
    this.pollInterval = null
  }
}

export default TransloaditAssembly
