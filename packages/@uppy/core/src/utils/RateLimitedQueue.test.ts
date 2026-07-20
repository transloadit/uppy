import { describe, expect, it } from 'vitest'
import delay from './delay.js'
import { RateLimitedQueue } from './RateLimitedQueue.js'

describe('RateLimitedQueue', () => {
  let pending = 0
  async function fn() {
    pending++
    return delay(15).then(() => pending--)
  }

  it('should run at most N promises at the same time', async () => {
    const queue = new RateLimitedQueue(4)
    const fn2 = queue.wrapPromiseFunction(fn)

    const result = Promise.all([
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
    ])

    expect(pending).toBe(4)

    await delay(10)
    expect(pending).toBe(4)

    await result
    expect(pending).toBe(0)
  })

  it('should accept Infinity as limit', () => {
    const queue = new RateLimitedQueue(Infinity)
    const fn2 = queue.wrapPromiseFunction(fn)

    const result = Promise.all([
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
    ])

    expect(pending).toBe(10)

    return result.then(() => {
      expect(pending).toBe(0)
    })
  })

  it('should accept non-promise function in wrapPromiseFunction()', () => {
    const queue = new RateLimitedQueue(1)
    function syncFn() {
      return 1
    }
    const fn2 = queue.wrapPromiseFunction(syncFn)

    return Promise.all([
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
      fn2(),
    ])
  })
})
