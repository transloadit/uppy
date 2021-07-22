'use strict'

/* global globalThis */

const cuid = require('./index.js')

const MAX = 1_200_000

function collisionTest (fn) {
  const ids = new Set()

  for (let i = 0; i < MAX; i++) {
    const id = fn()

    if (ids.has(id)) {
      throw new Error(`Failed at ${i} iterations.`)
    } else {
      ids.add(id)
    }
  }
}

describe('cuid tests', () => {
  if (typeof crypto === 'undefined') {
    beforeAll(() => {
      // eslint-disable-next-line global-require
      const crypto = require('crypto')
      globalThis.crypto = crypto.webcrypto ?? {
        getRandomValues (array) {
          const buffer = Buffer.from(array.buffer)
          crypto.randomFillSync(buffer)
          return array
        },
      }
    })

    afterAll(() => {
      delete globalThis.crypto
    })
  }

  it('should generate a string containing alpha-numeric chars', () => {
    expect(typeof cuid()).toBe('string')
    expect(cuid()).toMatch(/^c\w{16,}$/)
  })

  // perform collision test only if we aren't in the browser
  it('should not generate collisions', () => {
    expect(() => collisionTest(cuid)).not.toThrow()
  })
})
