function createCancelError () {
  return new Error('Cancelled')
}

export class RateLimitedQueue {
  #activeRequests = 0

  #queuedHandlers = []

  #paused = false

  #pauseTimer

  #downLimit = 1

  #upperLimit

  #rateLimitingTimer

  constructor (limit) {
    if (typeof limit !== 'number' || limit === 0) {
      this.limit = Infinity
    } else {
      this.limit = limit
    }
  }

  #call (fn) {
    this.#activeRequests += 1

    let done = false

    let cancelActive
    try {
      cancelActive = fn()
    } catch (err) {
      this.#activeRequests -= 1
      throw err
    }

    return {
      abort: () => {
        if (done) return
        done = true
        this.#activeRequests -= 1
        cancelActive()
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

  #queueNext () {
    // Do it soon but not immediately, this allows clearing out the entire queue synchronously
    // one by one without continuously _advancing_ it (and starting new tasks before immediately
    // aborting them)
    queueMicrotask(() => this.#next())
  }

  #next () {
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
    const handler = this.#call(next.fn)
    next.abort = handler.abort
    next.done = handler.done
  }

  #queue (fn, options = {}) {
    const handler = {
      fn,
      priority: options.priority || 0,
      abort: () => {
        this.#dequeue(handler)
      },
      done: () => {
        throw new Error('Cannot mark a queued request as done: this indicates a bug')
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

  #dequeue (handler) {
    const index = this.#queuedHandlers.indexOf(handler)
    if (index !== -1) {
      this.#queuedHandlers.splice(index, 1)
    }
  }

  run (fn, queueOptions) {
    if (!this.#paused && this.#activeRequests < this.limit) {
      return this.#call(fn)
    }
    return this.#queue(fn, queueOptions)
  }

  wrapPromiseFunction (fn, queueOptions) {
    return (...args) => {
      let queuedRequest
      const outerPromise = new Promise((resolve, reject) => {
        queuedRequest = this.run(() => {
          let cancelError
          let innerPromise
          try {
            innerPromise = Promise.resolve(fn(...args))
          } catch (err) {
            innerPromise = Promise.reject(err)
          }

          innerPromise.then((result) => {
            if (cancelError) {
              reject(cancelError)
            } else {
              queuedRequest.done()
              resolve(result)
            }
          }, (err) => {
            if (cancelError) {
              reject(cancelError)
            } else {
              queuedRequest.done()
              reject(err)
            }
          })

          return () => {
            cancelError = createCancelError()
          }
        }, queueOptions)
      })

      outerPromise.abort = () => {
        queuedRequest.abort()
      }

      return outerPromise
    }
  }

  resume () {
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
  pause (duration = null) {
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
  rateLimit (duration) {
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
    this.limit = Math.ceil((this.#upperLimit + this.#downLimit) / 2)
    for (let i = this.#downLimit; i <= this.limit; i++) {
      this.#queueNext()
    }
    if (this.#upperLimit - this.#downLimit > 3) {
      this.#rateLimitingTimer = setTimeout(this.#increaseLimit, 2000)
    } else {
      this.#downLimit = Math.floor(this.#downLimit / 2)
    }
  }

  get isPaused () { return this.#paused }
}

export const internalRateLimitedQueue = Symbol('__queue')
