const delay = require('./delay')
const { AbortController } = require('./AbortController')

describe('delay', () => {
  it('should wait for the specified time', async () => {
    const start = Date.now()
    await delay(100)
    expect(Date.now() - start).toBeGreaterThanOrEqual(100)
  })

  it('should reject if signal is already aborted', async () => {
    const signal = { aborted: true }
    const start = Date.now()
    await expect(delay(100, { signal })).rejects.toHaveProperty('name', 'AbortError')
    // should really be instant but using a very large range in case CI decides to be super busy and block the event loop for a while
    expect(Date.now() - start).toBeLessThan(50)
  })

  it('should reject when signal is aborted', async () => {
    const controller = new AbortController()
    const start = Date.now()
    const testDelay = delay(100, { signal: controller.signal })
    await Promise.all([
      delay(50).then(() => controller.abort()),
      expect(testDelay).rejects.toHaveProperty('name', 'AbortError')
    ])

    // should have rejected before the timer is done
    const time = Date.now() - start
    expect(time).toBeGreaterThanOrEqual(50)
    expect(time).toBeLessThan(100)
  })
})
