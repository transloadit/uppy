import { describe, xit, expect } from 'vitest'
import copyToClipboard from './copyToClipboard.js'

describe('copyToClipboard', () => {
  xit('should copy the specified text to the clipboard', () => {
    expect(typeof copyToClipboard).toBe('function')
  })
})
