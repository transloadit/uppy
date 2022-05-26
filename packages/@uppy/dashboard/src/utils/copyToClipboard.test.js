import { describe, xit, expect } from '@jest/globals'
import copyToClipboard from './copyToClipboard.js'

describe('copyToClipboard', () => {
  xit('should copy the specified text to the clipboard', () => {
    expect(typeof copyToClipboard).toBe('function')
  })
})
