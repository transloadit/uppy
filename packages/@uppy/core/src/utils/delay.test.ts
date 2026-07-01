import { describe, expect, it } from 'vitest'
import { AbortController } from './AbortController.js'
import delay from './delay.js'

describe('delay', () => {
  it('should wait for the specified time', async () => {
    const start = Date.now()
    await delay(100)
    // 100 is less of a rule, more of a guideline
    // according to CI
    expect(Date.now() - start).toBeGreaterThanOrEqual(90)
  })

  it('should reject if signal is already aborted', async () => {
    const signal = { aborted: true } as any as AbortSignal
    const start = Date.now()
    await expect(delay(100, { signal })).rejects.toHaveProperty(
      'name',
      'AbortError',
    )
    // should really be instant but using a very large range in case CI decides
    // to be super busy and block the event loop for a while.
    expect(Date.now() - start).toBeLessThan(50)
  })

  it('should reject when signal is aborted', async () => {
    const controller = new AbortController()
    const start = Date.now()
    const testDelay = delay(1000, { signal: controller.signal })
    await Promise.all([
      delay(50).then(() => controller.abort()),
      expect(testDelay).rejects.toHaveProperty('name', 'AbortError'),
    ])

    // should have rejected before the timer is done
    const time = Date.now() - start
    expect(time).toBeGreaterThanOrEqual(30)
    expect(time).toBeLessThan(900)
  })
})
