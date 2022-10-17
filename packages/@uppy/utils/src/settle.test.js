import { describe, expect, it } from '@jest/globals'
import settle from './settle.js'

describe('settle', () => {
  it('should resolve even if all input promises reject', async () => {
    await expect(
      settle([
        Promise.reject(new Error('oops')),
        Promise.reject(new Error('this went wrong')),
      ]),
    ).resolves.toMatchObject({
      successful: [],
      failed: [new Error('oops'), new Error('this went wrong')],
    })
  })

  it('should resolve with an object if some input promises resolve', async () => {
    await expect(
      settle([
        Promise.reject(new Error('rejected')),
        Promise.resolve('resolved'),
        Promise.resolve('also-resolved'),
      ]),
    ).resolves.toMatchObject({
      successful: ['resolved', 'also-resolved'],
      failed: [new Error('rejected')],
    })
  })
})
