import { describe, expect, it } from 'vitest'
import isPreviewSupported from '../../lib/utils/isPreviewSupported.js'

describe('isPreviewSupported', () => {
  it.each([
    'image/jpeg',
    'image/gif',
    'image/png',
    'image/svg',
    'image/svg+xml',
    'image/bmp',
    'image/jpg',
    'image/webp',
    'image/avif',
  ])('should return true for %s', (ext) => {
    expect(isPreviewSupported(ext)).toEqual(true)
  })

  it('should return false for unsupported file types', () => {
    expect(isPreviewSupported('foo')).toEqual(false)
  })
})
