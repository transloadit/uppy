import { describe, expect, test } from 'vitest'
import { shouldInterceptGrantError } from '../dist/companion.js'

describe('shouldInterceptGrantError (deprecated, still exported)', () => {
  test('matches only grant callback paths', () => {
    expect(shouldInterceptGrantError('/connect/dropbox/callback')).toBe(true)
    expect(shouldInterceptGrantError('/connect/googledrive/callback')).toBe(
      true,
    )
    expect(shouldInterceptGrantError('/box/thumbnail/123')).toBe(false)
    expect(shouldInterceptGrantError('/health')).toBe(false)
    expect(shouldInterceptGrantError('/connect/dropbox/redirect')).toBe(false)
  })
})
