/**
 * A promise that can be aborted.
 */
export interface AbortablePromise<T> extends Promise<T> {
  abort(reason?: unknown): void
  /**
   * @deprecated Legacy compatibility - abort when signal fires
   */
  abortOn(signal?: AbortSignal): AbortablePromise<T>
}

interface QueuedTask<T> {
  run: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
  controller: AbortController
}

interface HeapItem<T> {
  task: QueuedTask<T>
  priority: number
}

/**
 * Binary max-heap for priority queue ordering.
 * Higher priority values are dequeued first.
 */
class MaxHeap<T> {
  #items: HeapItem<T>[] = []

  get size(): number {
    return this.#items.length
  }

  push(task: QueuedTask<T>, priority: number): void {
    this.#items.push({ task, priority })
    this.#bubbleUp(this.#items.length - 1)
  }

  pop(): QueuedTask<T> | undefined {
    if (this.#items.length === 0) return undefined

    const max = this.#items[0]
    const last = this.#items.pop()!

    if (this.#items.length > 0) {
      this.#items[0] = last
      this.#bubbleDown(0)
    }

    return max.task
  }

  /**
   * Remove a specific task from the heap.
   * O(n) but necessary for abort support.
   */
  remove(task: QueuedTask<T>): boolean {
    const index = this.#items.findIndex((item) => item.task === task)
    if (index === -1) return false

    const last = this.#items.pop()!
    if (index < this.#items.length) {
      this.#items[index] = last
      // Re-heapify: could go up or down depending on priority
      this.#bubbleUp(index)
      this.#bubbleDown(index)
    }

    return true
  }

  clear(): QueuedTask<T>[] {
    const tasks = this.#items.map((item) => item.task)
    this.#items = []
    return tasks
  }

  #bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.#items[parentIndex].priority >= this.#items[index].priority) {
        break
      }
      this.#swap(index, parentIndex)
      index = parentIndex
    }
  }

  #bubbleDown(index: number): void {
    const length = this.#items.length

    while (true) {
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2
      let largest = index

      if (
        leftChild < length &&
        this.#items[leftChild].priority > this.#items[largest].priority
      ) {
        largest = leftChild
      }

      if (
        rightChild < length &&
        this.#items[rightChild].priority > this.#items[largest].priority
      ) {
        largest = rightChild
      }

      if (largest === index) break

      this.#swap(index, largest)
      index = largest
    }
  }

  #swap(i: number, j: number): void {
    const temp = this.#items[i]
    this.#items[i] = this.#items[j]
    this.#items[j] = temp
  }
}

export interface TaskQueueOptions {
  concurrency?: number
}

export interface AddOptions {
  priority?: number
}

/**
 * A concurrent task queue with priority ordering.
 *
 * Tasks are functions that receive an AbortSignal and return a Promise.
 * The queue manages concurrency and priority (higher priority runs first).
 *
 * @example
 * ```ts
 * const queue = new TaskQueue({ concurrency: 3 })
 *
 * const promise = queue.add(async (signal) => {
 *   const response = await fetch(url, { signal })
 *   return response.json()
 * })
 *
 * // To abort:
 * promise.abort()
 * ```
 */
export class TaskQueue {
  #heap = new MaxHeap<unknown>()
  #running = 0
  #concurrency: number
  #paused = false

  constructor(options?: TaskQueueOptions) {
    const limit = options?.concurrency
    this.#concurrency =
      typeof limit !== 'number' || limit === 0 ? Infinity : limit
  }

  /**
   * Add a task to the queue.
   *
   * @param task - Function receiving AbortSignal, returns Promise
   * @param options - Optional priority (higher = more urgent, default 0)
   * @returns AbortablePromise that resolves with task result
   */
  add<T>(
    task: (signal: AbortSignal) => Promise<T>,
    options?: AddOptions,
  ): AbortablePromise<T> {
    const controller = new AbortController()
    const priority = options?.priority ?? 0

    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void

    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    }) as AbortablePromise<T>

    const queuedTask: QueuedTask<T> = {
      run: () => task(controller.signal),
      resolve,
      reject,
      controller,
    }

    // Handle abort while queued
    controller.signal.addEventListener(
      'abort',
      () => {
        if (this.#heap.remove(queuedTask as QueuedTask<unknown>)) {
          reject(
            controller.signal.reason ??
              new DOMException('Aborted', 'AbortError'),
          )
        }
      },
      { once: true },
    )

    promise.abort = (reason?: unknown) => {
      controller.abort(reason ?? new DOMException('Aborted', 'AbortError'))
    }

    // Legacy compatibility: abortOn method
    promise.abortOn = (signal?: AbortSignal) => {
      if (signal) {
        const onAbort = () => promise.abort(signal.reason)
        signal.addEventListener('abort', onAbort, { once: true })
        promise.then(
          () => signal.removeEventListener('abort', onAbort),
          () => signal.removeEventListener('abort', onAbort),
        )
      }
      return promise
    }

    // Run immediately or queue
    if (!this.#paused && this.#running < this.#concurrency) {
      this.#execute(queuedTask)
    } else {
      this.#heap.push(queuedTask as QueuedTask<unknown>, priority)
    }

    return promise
  }

  #execute<T>(task: QueuedTask<T>): void {
    this.#running++

    // Check if already aborted before starting
    if (task.controller.signal.aborted) {
      this.#running--
      task.reject(
        task.controller.signal.reason ??
          new DOMException('Aborted', 'AbortError'),
      )
      this.#advance()
      return
    }

    task
      .run()
      .then(
        (result) => {
          if (task.controller.signal.aborted) {
            task.reject(
              task.controller.signal.reason ??
                new DOMException('Aborted', 'AbortError'),
            )
          } else {
            task.resolve(result)
          }
        },
        (error) => {
          task.reject(error)
        },
      )
      .finally(() => {
        this.#running--
        this.#advance()
      })
  }

  #advance(): void {
    // Use microtask to allow batch aborts without starting new tasks
    queueMicrotask(() => {
      if (this.#paused || this.#running >= this.#concurrency) return

      while (true) {
        const next = this.#heap.pop()
        if (!next) return
        if (next.controller.signal.aborted) continue
        this.#execute(next)
        return
      }
    })
  }

  /**
   * Pause the queue. Running tasks continue, but no new tasks start.
   */
  pause(): void {
    this.#paused = true
  }

  /**
   * Resume the queue and start processing pending tasks.
   */
  resume(): void {
    this.#paused = false
    // Kick off tasks up to concurrency limit
    const available = this.#concurrency - this.#running
    for (let i = 0; i < available; i++) {
      this.#advance()
    }
  }

  /**
   * Clear all pending tasks from the queue.
   * Running tasks are not affected.
   *
   * @param reason - Optional reason for rejection (defaults to AbortError)
   */
  clear(reason?: unknown): void {
    const tasks = this.#heap.clear()
    const error = reason ?? new DOMException('Cleared', 'AbortError')
    for (const task of tasks) {
      task.controller.abort(error)
      task.reject(error)
    }
  }

  get concurrency(): number {
    return this.#concurrency
  }

  set concurrency(value: number) {
    this.#concurrency =
      typeof value !== 'number' || value === 0 ? Infinity : value
    // If concurrency increased, try to start more tasks
    if (!this.#paused) {
      const available = this.#concurrency - this.#running
      for (let i = 0; i < available; i++) {
        this.#advance()
      }
    }
  }

  get pending(): number {
    return this.#heap.size
  }

  get running(): number {
    return this.#running
  }

  get isPaused(): boolean {
    return this.#paused
  }

  /**
   * @deprecated Legacy compatibility wrapper for RateLimitedQueue API.
   * Wraps a function so that when called, it's queued and returns an AbortablePromise.
   */
  wrapPromiseFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: AddOptions,
  ): (...args: Parameters<T>) => AbortablePromise<Awaited<ReturnType<T>>> {
    return (...args: Parameters<T>) => {
      return this.add((signal) => {
        // The wrapped function doesn't receive signal directly,
        // caller is responsible for using signal if needed
        void signal
        return fn(...args)
      }, options)
    }
  }
}
