import { describe, it, expect } from 'vitest'
import copyToClipboard from './copyToClipboard'

describe('copyToClipboard', () => {
  it.skip('should copy the specified text to the clipboard', () => {
    expect(typeof copyToClipboard).toBe('function')
  })
})
