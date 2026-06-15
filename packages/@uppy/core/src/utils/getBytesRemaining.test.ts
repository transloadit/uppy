import { describe, expect, it } from 'vitest'
import getBytesRemaining from './getBytesRemaining.js'

describe('getBytesRemaining', () => {
  it('should calculate the bytes remaining given a fileProgress object', () => {
    const fileProgress = {
      bytesUploaded: 1024,
      bytesTotal: 3096,
      progress: 0,
      uploadComplete: false,
      percentage: 0,
      uploadStarted: 0,
    }
    expect(getBytesRemaining(fileProgress)).toEqual(2072)
  })
})
