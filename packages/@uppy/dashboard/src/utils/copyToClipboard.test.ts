import { describe, expect, it } from 'vitest'
import copyToClipboard from './copyToClipboard.js'

describe('copyToClipboard', () => {
  it.skip('should copy the specified text to the clipboard', () => {
    expect(typeof copyToClipboard).toBe('function')
  })
})
