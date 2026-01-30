import { describe, expect, it } from 'vitest'
import delay from './delay.js'
import { TaskQueue } from './TaskQueue.js'

describe('TaskQueue', () => {
  it('runs queued tasks by priority after resume', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    queue.pause()

    const order: string[] = []
    const makeTask = (label: string) => async () => {
      order.push(label)
      await delay(5)
      return label
    }

    const low = queue.add(makeTask('low'), { priority: 1 })
    const high = queue.add(makeTask('high'), { priority: 10 })
    const mid = queue.add(makeTask('mid'), { priority: 5 })

    expect(queue.pending).toBe(3)

    queue.resume()
    await Promise.all([low, high, mid])

    expect(order).toEqual(['high', 'mid', 'low'])
  })

  it('aborts a queued task without executing it', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const runningBlocker = Promise.withResolvers<void>()
    const started: string[] = []

    const running = queue.add(async () => {
      started.push('first')
      await runningBlocker.promise
    })
    const queued = queue.add(async () => {
      started.push('second')
      return 'second'
    })

    const reason = new Error('nope')
    queued.abort(reason)

    await expect(queued).rejects.toBe(reason)

    runningBlocker.resolve()
    await running

    expect(started).toEqual(['first'])
    expect(queue.pending).toBe(0)
  })

  it('rejects a running task when aborted before it resolves', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const deferred = Promise.withResolvers<string>()

    const promise = queue.add(async () => deferred.promise)
    const reason = new Error('stop')
    promise.abort(reason)

    deferred.resolve('ok')

    await expect(promise).rejects.toBe(reason)
  })

  it('clear rejects pending tasks but leaves running tasks alone', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const runningDeferred = Promise.withResolvers<string>()

    const running = queue.add(async () => runningDeferred.promise)
    const queued1 = queue.add(async () => 'queued1')
    const queued2 = queue.add(async () => 'queued2')

    const reason = new Error('cleared')
    queue.clear(reason)

    await expect(queued1).rejects.toBe(reason)
    await expect(queued2).rejects.toBe(reason)

    runningDeferred.resolve('ok')
    await expect(running).resolves.toBe('ok')
    expect(queue.pending).toBe(0)
  })

  it('wrapPromiseFunction queues work and preserves arguments', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    queue.pause()

    const order: string[] = []
    const makeTask = (label: string) => async () => {
      order.push(label)
      return label
    }

    const wrapped = queue.wrapPromiseFunction(
      async (value: string) => {
        order.push(`wrapped:${value}`)
        return value.toUpperCase()
      },
      { priority: 5 },
    )

    const high = queue.add(makeTask('high'), { priority: 10 })
    const wrappedPromise = wrapped('hello')

    expect(typeof wrappedPromise.abort).toBe('function')

    queue.resume()

    await expect(high).resolves.toBe('high')
    await expect(wrappedPromise).resolves.toBe('HELLO')
    expect(order).toEqual(['high', 'wrapped:hello'])
  })

  it('updates concurrency via setter and starts additional tasks', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const started1 = Promise.withResolvers<void>()
    const started2 = Promise.withResolvers<void>()
    const blocker1 = Promise.withResolvers<void>()
    const blocker2 = Promise.withResolvers<void>()

    const first = queue.add(async () => {
      started1.resolve()
      await blocker1.promise
      return 'first'
    })

    const second = queue.add(async () => {
      started2.resolve()
      await blocker2.promise
      return 'second'
    })

    await started1.promise
    expect(queue.running).toBe(1)
    expect(queue.pending).toBe(1)

    queue.concurrency = 2
    await started2.promise

    expect(queue.running).toBe(2)
    expect(queue.pending).toBe(0)

    blocker1.resolve()
    blocker2.resolve()
    await expect(first).resolves.toBe('first')
    await expect(second).resolves.toBe('second')
  })

  it('aborts when abortOn signal fires while queued', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    queue.pause()

    const controller = new AbortController()
    const promise = queue.add(async () => 'ok')
    const returned = promise.abortOn(controller.signal)

    expect(returned).toBe(promise)

    const reason = new Error('signal abort')
    controller.abort(reason)

    await expect(promise).rejects.toBe(reason)
    expect(queue.pending).toBe(0)
  })

  it('runs tasks concurrently up to the concurrency limit', async () => {
    const queue = new TaskQueue({ concurrency: 2 })
    const started1 = Promise.withResolvers<void>()
    const started2 = Promise.withResolvers<void>()
    const started3 = Promise.withResolvers<void>()
    const blocker1 = Promise.withResolvers<void>()
    const blocker2 = Promise.withResolvers<void>()
    const blocker3 = Promise.withResolvers<void>()

    const first = queue.add(async () => {
      started1.resolve()
      await blocker1.promise
      return 'first'
    })
    const second = queue.add(async () => {
      started2.resolve()
      await blocker2.promise
      return 'second'
    })
    const third = queue.add(async () => {
      started3.resolve()
      await blocker3.promise
      return 'third'
    })

    await Promise.all([started1.promise, started2.promise])

    let thirdStarted = false
    started3.promise.then(() => {
      thirdStarted = true
    })

    await delay(1)
    expect(thirdStarted).toBe(false)
    expect(queue.running).toBe(2)
    expect(queue.pending).toBe(1)

    blocker1.resolve()
    await started3.promise

    blocker2.resolve()
    blocker3.resolve()
    await expect(first).resolves.toBe('first')
    await expect(second).resolves.toBe('second')
    await expect(third).resolves.toBe('third')
  })

  it('continues processing after aborting a running task', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const started1 = Promise.withResolvers<void>()
    const started2 = Promise.withResolvers<void>()
    const blocker1 = Promise.withResolvers<void>()

    const first = queue.add(async () => {
      started1.resolve()
      await blocker1.promise
      return 'first'
    })

    const second = queue.add(async () => {
      started2.resolve()
      return 'second'
    })

    await started1.promise
    const reason = new Error('abort running')
    first.abort(reason)
    blocker1.resolve()

    await expect(first).rejects.toBe(reason)
    await started2.promise
    await expect(second).resolves.toBe('second')
  })
})
