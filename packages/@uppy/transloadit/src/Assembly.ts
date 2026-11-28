import type {
  RateLimitedQueue,
  WrapPromiseFunctionType,
} from '@uppy/core/utils'

import type { AssemblyFile, AssemblyResponse, AssemblyResult } from './index.js'

import { fetchWithNetworkError, NetworkError, toError } from '@uppy/core/utils'
import Emitter from 'component-emitter'

import { getAssemblyUrlSsl } from './index.js'

const ASSEMBLY_UPLOADING = 'ASSEMBLY_UPLOADING'
const ASSEMBLY_EXECUTING = 'ASSEMBLY_EXECUTING'
const ASSEMBLY_COMPLETED = 'ASSEMBLY_COMPLETED'
const ASSEMBLY_CANCELED = 'ASSEMBLY_CANCELED'

const statusOrder = [ASSEMBLY_UPLOADING, ASSEMBLY_EXECUTING, ASSEMBLY_COMPLETED]

/**
 * Check that an assembly status is equal to or larger than some desired status,
 * so that we can emit the 'executing' event even if the execution step was so
 * fast that we jumped from UPLOADING straight to COMPLETED.
 */
function isStatus(status: unknown, test: string) {
  if (typeof status !== 'string') {
    return false
  }

  return statusOrder.indexOf(status) >= statusOrder.indexOf(test)
}

function mergeById<T extends { id?: string }>(snapshot: T[], known: T[]) {
  const ids = new Set(snapshot.map(({ id }) => id))
  return [...snapshot, ...known.filter(({ id }) => id != null && !ids.has(id))]
}

class TransloaditAssembly extends Emitter {
  #rateLimitedQueue: RateLimitedQueue

  #fetchWithNetworkError: WrapPromiseFunctionType<typeof fetchWithNetworkError>

  #previousFetchStatusStillPending = false

  #streamGeneration = 0

  #sse: EventSource | null = null

  /**
   * Lifecycle events already emitted. Each can be derived both from an SSE
   * marker and from a polled status, and a client-advanced `ok` or a late poll
   * must neither repeat nor suppress one. A restored assembly starts empty, so
   * the new page gets them all again.
   */
  #emitted = new Set<'executing' | 'metadata' | 'finished'>()
  #emittedResults = new Set<string>()

  #status: AssemblyResponse

  pollInterval: ReturnType<typeof setInterval> | null

  closed: boolean

  constructor(assembly: AssemblyResponse, rateLimitedQueue: RateLimitedQueue) {
    super()

    // The current assembly status.
    this.#status = assembly
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
    if (this.closed || this.#sse != null) return
    this.#connectServerSentEvents()
    this.#beginPolling()
  }

  #emitOnce(event: 'executing' | 'metadata' | 'finished') {
    if (this.#emitted.has(event)) return
    this.#emitted.add(event)
    this.emit(event)
  }

  #onFinished() {
    this.#emitOnce('finished')
    this.close()
  }

  #emitResult(step: string, result: { id?: string }) {
    if (result.id != null) {
      const key = JSON.stringify([step, result.id])
      if (this.#emittedResults.has(key)) return
      this.#emittedResults.add(key)
    }
    this.emit('result', step, result)
  }

  get status(): AssemblyResponse {
    return this.#status
  }
  set status(status: AssemblyResponse) {
    // `progress_combined` only arrives over SSE; a full status fetched from
    // the server never carries it, so keep the last value we saw while
    // executing. Past that it would only be stale.
    const { progress_combined } = this.#status
    this.#status =
      progress_combined != null && status.ok === ASSEMBLY_EXECUTING
        ? { progress_combined, ...status }
        : status
    this.emit('status', this.#status)
  }

  #connectServerSentEvents() {
    this.#sse = new EventSource(
      `${this.status.websocket_url}?assembly=${this.status.assembly_id}`,
    )

    let opened = false
    this.#sse.addEventListener('open', () => {
      if (opened) {
        // Keep one poll timer until a status read covers the gap in live events.
        this.#beginPolling(true)
        this.#fetchStatus({ recovering: true })
      } else {
        this.#stopPolling()
      }
      opened = true
    })
    this.#sse.addEventListener('error', () => {
      // EventSource can either retry or close permanently after a transport error.
      this.#streamGeneration += 1
      this.#beginPolling(opened)
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
        // SSE only sends this marker, never a new envelope, so advance `ok`
        // here. UPLOADING is the only state this marker can legitimately
        // leave; a refetch may already have moved on (or errored).
        if (this.status.ok === ASSEMBLY_UPLOADING) {
          // `AssemblyStatus` is a union; overriding `ok` on a spread needs a cast.
          this.status = {
            ...this.status,
            ok: ASSEMBLY_EXECUTING,
          } as AssemblyResponse
        }
        this.#emitOnce('executing')
      }

      if (e.data === 'assembly_upload_meta_data_extracted') {
        this.#emitOnce('metadata')
        this.#fetchStatus({ diff: false })
      }
    })

    this.#sse.addEventListener('assembly_upload_finished', (e) => {
      const file: AssemblyFile = JSON.parse(e.data)
      this.status = {
        ...this.status,
        uploads: [...(this.status.uploads ?? []), file],
      }
      this.emit('upload', file)
    })

    this.#sse.addEventListener('assembly_result_finished', (e) => {
      const [stepName, result]: [string, AssemblyResult] = JSON.parse(e.data)
      const stepResults = this.status.results?.[stepName] ?? []
      if (
        result.id == null ||
        !stepResults.some(({ id }) => id === result.id)
      ) {
        this.status = {
          ...this.status,
          results: {
            ...this.status.results,
            [stepName]: [...stepResults, result],
          },
        }
      }
      this.#emitResult(stepName, result)
    })

    this.#sse.addEventListener('assembly_execution_progress', (e) => {
      const details = JSON.parse(e.data)
      // setting combined execution progress of the assembly
      if (typeof details.progress_combined === 'number') {
        this.status = {
          ...this.status,
          progress_combined: details.progress_combined,
        }
      }
      this.emit('execution-progress', details)
    })

    this.#sse.addEventListener('assembly_error', (e) => {
      try {
        this.#onError(JSON.parse(e.data))
      } catch {
        this.#onError(new Error(e.data))
      }
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
  #beginPolling(recovering = false) {
    if (this.closed || this.pollInterval != null) return
    this.pollInterval = setInterval(() => {
      this.#fetchStatus({ recovering })
    }, 2000)
  }

  #stopPolling() {
    clearInterval(this.pollInterval ?? undefined)
    this.pollInterval = null
  }

  #mergeStreamedStatus(status: AssemblyResponse): AssemblyResponse {
    // A recovery snapshot can lag behind data already received over the stream.
    const { uploads, results: known } = this.status
    for (const [step, entries] of Object.entries(known ?? {})) {
      status.results ??= {}
      status.results[step] = mergeById(status.results[step] ?? [], entries)
    }
    if (Array.isArray(uploads))
      status.uploads = mergeById(status.uploads ?? [], uploads)
    if (
      status.ok === ASSEMBLY_UPLOADING &&
      this.status.ok === ASSEMBLY_EXECUTING
    )
      status.ok = ASSEMBLY_EXECUTING
    return status
  }

  /**
   * Reload assembly status. Useful if SSE doesn't work.
   *
   * Pass `diff: false` to avoid emitting diff events, instead only emitting
   * 'status'.
   */
  async #fetchStatus({ diff = true, recovering = false } = {}) {
    if (
      this.closed ||
      this.#rateLimitedQueue.isPaused ||
      this.#previousFetchStatusStillPending
    )
      return

    const catchingUp = recovering && this.#sse?.readyState === EventSource.OPEN
    const generation = this.#streamGeneration
    const previous = this.status
    try {
      this.#previousFetchStatusStillPending = true
      const statusUrl = getAssemblyUrlSsl(this.status)

      const response = await this.#fetchWithNetworkError(statusUrl)

      if (this.closed) return

      if (response.status === 429) {
        this.#rateLimitedQueue.rateLimit(2_000)
        return
      }

      if (!response.ok) {
        if (recovering && response.status >= 500) return
        this.#onError(new NetworkError(response.statusText))
        return
      }

      let status: AssemblyResponse = await response.json().catch((error) => {
        if (!recovering || !(error instanceof TypeError)) throw error
      })
      if (this.closed || status === undefined) return
      if (recovering || previous !== this.status) {
        status = this.#mergeStreamedStatus(status)
      }

      if (diff) {
        this.updateStatus(status)
      } else {
        this.status = status
      }
      if (catchingUp && generation === this.#streamGeneration) {
        this.#stopPolling()
      }
    } catch (err) {
      // A fetch that was in flight when we closed is nobody's business.
      if (this.closed || (recovering && err instanceof NetworkError)) return
      this.#onError(toError(err))
    } finally {
      this.#previousFetchStatusStillPending = false
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
    const finished = this.#diffStatus(this.status, next)
    // An errored status closed the assembly in `#onError`; don't emit a
    // 'status' from a closed assembly.
    if (this.closed) return
    this.status = next
    if (finished) this.close()
  }

  /**
   * Diff two assembly statuses, and emit the events necessary to go from `prev`
   * to `next`.
   */
  #diffStatus(prev: AssemblyResponse, next: AssemblyResponse) {
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

    // The API sends no metadata marker on the polling path, so both events are
    // approximated from the status: they fire on the first status we see at or
    // past EXECUTING, not on the crossing into it. `#emitOnce` keeps that to
    // one emit each. Deriving them from the crossing instead would emit
    // nothing at all whenever we never observe it — a restore, or an assembly
    // already executing when we first see it — which strands uploads that
    // complete off these events. The cost is that over SSE, where
    // `assembly_uploading_finished` precedes `assembly_upload_meta_data_extracted`,
    // a status landing between the two makes 'metadata' slightly early.
    const executing = isStatus(nextStatus, ASSEMBLY_EXECUTING)
    if (executing) {
      // Without SSE, this is our only way to tell if uploading finished.
      // Hence, we emit this just before the 'upload's and before the 'metadata'
      // event for the most intuitive ordering, corresponding to the _usual_
      // ordering (if not guaranteed) that you'd get on SSE.
      this.#emitOnce('executing')
    }

    // Only emit if the upload is new (not in prev.uploads).
    const prevUploads = prev.uploads
    const nextUploads = next.uploads
    if (nextUploads != null && prevUploads != null) {
      const previousIds = new Set(
        Object.values(prevUploads).map(({ id }) => id),
      )
      for (const upload of Object.keys(nextUploads)) {
        const id = nextUploads[upload as unknown as number].id
        if (
          id == null ? Object.hasOwn(prevUploads, upload) : previousIds.has(id)
        ) {
          continue
        }

        // This is a bit confusing. Not sure why Object.keys is used here, because nextUploads is an Array. Object.keys returns strings for array keys ("0", "1", etc.). Typescript expects arrays to be indexed with a number, not a string nextUploads[0], even though JavaScript is fine with it, so we need to type assert here:
        this.emit('upload', nextUploads[upload as unknown as number])
      }
    }

    if (executing) {
      this.#emitOnce('metadata')
    }

    // Find new results.
    const nextResultsMap = next.results
    const prevResultsMap = prev.results
    if (nextResultsMap != null && prevResultsMap != null) {
      for (const stepName of Object.keys(nextResultsMap)) {
        const nextResults = nextResultsMap[stepName] ?? []
        const prevResults = prevResultsMap[stepName] ?? []

        for (const result of nextResults) {
          if (prevResults?.some((p) => p.id === result.id)) {
            continue
          }

          this.#emitResult(stepName, result)
        }
      }
    }

    if (
      nextStatus === ASSEMBLY_CANCELED ||
      isStatus(nextStatus, ASSEMBLY_COMPLETED)
    ) {
      this.#emitOnce('finished')
      return true
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
    this.#stopPolling()
  }
}

export default TransloaditAssembly
