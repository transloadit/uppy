import { describe, expect, it } from 'vitest'
import mimeMatch from '../../lib/utils/mimeMatch.js'

describe('mimeMatch', () => {
  it.each([
    ['image/jpeg', 'image/jpeg', true],
    ['image/jpeg', 'image/*', true],
    ['image/svg+xml', 'image/*', true],
    ['video/mp4', 'image/*', false],
    ['image/png', '*/*', true],
    ['image/png', '*', true],
    ['image', 'image/*', false],
    ['application/vnd.ms-excel', 'application/vnd.*', true],
    ['image/jpeg', 'image/jpe*', false],
    ['text/plain', 'text/*;charset=utf-8', true],
    ['image/jpeg', 'IMAGE/*', false],
  ])('%s matches %s: %s', (target, pattern, expected) => {
    expect(mimeMatch(target, pattern)).toBe(expected)
  })
})
