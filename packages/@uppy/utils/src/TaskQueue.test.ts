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
})
