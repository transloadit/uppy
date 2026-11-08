import { describe, expect, it } from 'vitest'
import classNames from '../../lib/utils/classNames.js'

describe('classNames', () => {
  it('joins strings and truthy object keys, skipping falsy values', () => {
    expect(
      classNames('a', undefined, false, null, '', { b: true, c: false, d: 0 }),
    ).toBe('a b')
    expect(classNames({ x: 1 }, 'y z')).toBe('x y z')
    expect(classNames()).toBe('')
    expect(classNames(['a', ['b', { c: true }]], 1, [])).toBe('a b c 1')
  })
})
