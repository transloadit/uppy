import { describe, expect, it } from '@jest/globals'
import getBytesRemaining from './getBytesRemaining.js'

describe('getBytesRemaining', () => {
  it('should calculate the bytes remaining given a fileProgress object', () => {
    const fileProgress = {
      bytesUploaded: 1024,
      bytesTotal: 3096,
    }
    expect(getBytesRemaining(fileProgress)).toEqual(2072)
  })
})
