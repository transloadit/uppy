function createCancelError(cause?: string) {
  return new Error('Cancelled', { cause })
}

function abortOn(
  this: { abort: (cause: string) => void; then?: Promise<any>['then'] },
  signal?: AbortSignal,
) {
  if (signal != null) {
    const abortPromise = () => this.abort(signal.reason)
    signal.addEventListener('abort', abortPromise, { once: true })
    const removeAbortListener = () => {
      signal.removeEventListener('abort', abortPromise)
    }
    this.then?.(removeAbortListener, removeAbortListener)
  }

  return this
}

type Handler = {
  shouldBeRequeued?: boolean
  fn: () => (...args: any[]) => Promise<void> | void
  priority: number
  abort: (cause?: unknown) => void
  done: () => void
}

type QueueOptions = {
  priority?: number
}

export interface AbortablePromise<T> extends Promise<T> {
  abort(cause?: unknown): void
  abortOn: (...args: Parameters<typeof abortOn>) => AbortablePromise<T>
}

export type WrapPromiseFunctionType<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => AbortablePromise<Awaited<ReturnType<T>>>

export class RateLimitedQueue {
  #activeRequests = 0

  #queuedHandlers: Handler[] = []

  #paused = false

  #pauseTimer?: ReturnType<typeof setTimeout>

  #downLimit = 1

  #upperLimit?: number

  #rateLimitingTimer?: ReturnType<typeof setTimeout>

  limit: number

  constructor(limit?: number) {
    if (typeof limit !== 'number' || limit === 0) {
      this.limit = Infinity
    } else {
      this.limit = limit
    }
  }

  #call(fn: Handler['fn']) {
    this.#activeRequests += 1

    let done = false

    let cancelActive: (cause?: unknown) => void
    try {
      cancelActive = fn()
    } catch (err) {
      this.#activeRequests -= 1
      throw err
    }

    return {
      abort: (cause?: unknown) => {
        if (done) return
        done = true
        this.#activeRequests -= 1
        cancelActive?.(cause)
        this.#queueNext()
      },

      done: () => {
        if (done) return
        done = true
        this.#activeRequests -= 1
        this.#queueNext()
      },
    }
  }

  #queueNext() {
    // Do it soon but not immediately, this allows clearing out the entire queue synchronously
    // one by one without continuously _advancing_ it (and starting new tasks before immediately
    // aborting them)
    queueMicrotask(() => this.#next())
  }

  #next() {
    if (this.#paused || this.#activeRequests >= this.limit) {
      return
    }
    if (this.#queuedHandlers.length === 0) {
      return
    }

    // Dispatch the next request, and update the abort/done handlers
    // so that cancelling it does the Right Thing (and doesn't just try
    // to dequeue an already-running request).
    const next = this.#queuedHandlers.shift()
    if (next == null) {
      throw new Error('Invariant violation: next is null')
    }
    const handler = this.#call(next.fn)
    next.abort = handler.abort
    next.done = handler.done
  }

  #queue(fn: Handler['fn'], options?: QueueOptions) {
    const handler: Handler = {
      fn,
      priority: options?.priority || 0,
      abort: () => {
        this.#dequeue(handler)
      },
      done: () => {
        throw new Error(
          'Cannot mark a queued request as done: this indicates a bug',
        )
      },
    }

    const index = this.#queuedHandlers.findIndex((other) => {
      return handler.priority > other.priority
    })
    if (index === -1) {
      this.#queuedHandlers.push(handler)
    } else {
      this.#queuedHandlers.splice(index, 0, handler)
    }
    return handler
  }

  #dequeue(handler: Handler) {
    const index = this.#queuedHandlers.indexOf(handler)
    if (index !== -1) {
      this.#queuedHandlers.splice(index, 1)
    }
  }

  run(
    fn: Handler['fn'],
    queueOptions?: QueueOptions,
  ): Handler | Omit<Handler, 'fn' | 'priority'> {
    if (!this.#paused && this.#activeRequests < this.limit) {
      return this.#call(fn)
    }
    return this.#queue(fn, queueOptions)
  }

  wrapSyncFunction(fn: () => void, queueOptions: QueueOptions) {
    return (
      ...args: Parameters<Handler['fn']>
    ): { abortOn: typeof abortOn; abort: Handler['abort'] } => {
      const queuedRequest = this.run(() => {
        fn(...args)
        queueMicrotask(() => queuedRequest.done())
        return () => {}
      }, queueOptions)

      return {
        abortOn,
        abort() {
          queuedRequest.abort()
        },
      }
    }
  }

  wrapPromiseFunction<T extends (...args: any[]) => any>(
    fn: T,
    queueOptions?: QueueOptions,
  ) {
    return (
      ...args: Parameters<T>
    ): AbortablePromise<Awaited<ReturnType<T>>> => {
      let queuedRequest: ReturnType<RateLimitedQueue['run']>
      const outerPromise = new Promise((resolve, reject) => {
        queuedRequest = this.run(() => {
          let cancelError: ReturnType<typeof createCancelError>
          let innerPromise: Promise<Awaited<ReturnType<T>>>
          try {
            innerPromise = Promise.resolve(fn(...args))
          } catch (err) {
            innerPromise = Promise.reject(err)
          }

          innerPromise.then(
            (result) => {
              if (cancelError) {
                reject(cancelError)
              } else {
                queuedRequest.done()
                resolve(result)
              }
            },
            (err) => {
              if (cancelError) {
                reject(cancelError)
              } else {
                queuedRequest.done()
                reject(err)
              }
            },
          )

          return (cause) => {
            cancelError = createCancelError(cause)
          }
        }, queueOptions)
      }) as AbortablePromise<Awaited<ReturnType<T>>>

      outerPromise.abort = (cause) => {
        queuedRequest.abort(cause)
      }
      outerPromise.abortOn = abortOn as any

      return outerPromise
    }
  }

  resume(): void {
    this.#paused = false
    clearTimeout(this.#pauseTimer)
    for (let i = 0; i < this.limit; i++) {
      this.#queueNext()
    }
  }

  #resume = () => this.resume()

  /**
   * Freezes the queue for a while or indefinitely.
   *
   * @param {number | null } [duration] Duration for the pause to happen, in milliseconds.
   *                                    If omitted, the queue won't resume automatically.
   */
  pause(duration: number | null = null): void {
    this.#paused = true
    clearTimeout(this.#pauseTimer)
    if (duration != null) {
      this.#pauseTimer = setTimeout(this.#resume, duration)
    }
  }

  /**
   * Pauses the queue for a duration, and lower the limit of concurrent requests
   * when the queue resumes. When the queue resumes, it tries to progressively
   * increase the limit in `this.#increaseLimit` until another call is made to
   * `this.rateLimit`.
   * Call this function when using the RateLimitedQueue for network requests and
   * the remote server responds with 429 HTTP code.
   *
   * @param {number} duration in milliseconds.
   */
  rateLimit(duration: number): void {
    clearTimeout(this.#rateLimitingTimer)
    this.pause(duration)
    if (this.limit > 1 && Number.isFinite(this.limit)) {
      this.#upperLimit = this.limit - 1
      this.limit = this.#downLimit
      this.#rateLimitingTimer = setTimeout(this.#increaseLimit, duration)
    }
  }

  #increaseLimit = () => {
    if (this.#paused) {
      this.#rateLimitingTimer = setTimeout(this.#increaseLimit, 0)
      return
    }
    this.#downLimit = this.limit
    this.limit = Math.ceil((this.#upperLimit! + this.#downLimit) / 2)
    for (let i = this.#downLimit; i <= this.limit; i++) {
      this.#queueNext()
    }
    if (this.#upperLimit! - this.#downLimit > 3) {
      this.#rateLimitingTimer = setTimeout(this.#increaseLimit, 2000)
    } else {
      this.#downLimit = Math.floor(this.#downLimit / 2)
    }
  }

  get isPaused(): boolean {
    return this.#paused
  }
}

export const internalRateLimitedQueue = Symbol('__queue')
