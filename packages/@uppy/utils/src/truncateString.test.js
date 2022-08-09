import { describe, expect, it } from '@jest/globals'
import truncateString from './truncateString.js'

describe('truncateString', () => {
  it('should truncate the string to the length', () => {
    expect(truncateString('abcdefghijkl', 14)).toEqual('abcdefghijkl')
    expect(truncateString('abcdefghijkl', 13)).toEqual('abcdefghijkl')
    expect(truncateString('abcdefghijkl', 12)).toEqual('abcdefghijkl')
    expect(truncateString('abcdefghijkl', 11)).toEqual('abcd...ijkl')
    expect(truncateString('abcdefghijkl', 10)).toEqual('abcd...jkl')
    expect(truncateString('abcdefghijkl', 9)).toEqual('abc...jkl')
    expect(truncateString('abcdefghijkl', 8)).toEqual('abc...kl')
    expect(truncateString('abcdefghijkl', 7)).toEqual('ab...kl')
    expect(truncateString('abcdefghijkl', 6)).toEqual('ab...l')
    expect(truncateString('abcdefghijkl', 5)).toEqual('a...l')
    expect(truncateString('abcdefghijkl', 4)).toEqual('abc…')
    expect(truncateString('abcdefghijkl', 3)).toEqual('ab…')
    expect(truncateString('abcdefghijkl', 2)).toEqual('a…')
    expect(truncateString('abcdefghijkl', 1)).toEqual('…')
    expect(truncateString('abcdefghijkl', 0)).toEqual('')
  })

  it('should not truncate the string if it is already short enough', () => {
    expect(truncateString('hello world', 100)).toEqual('hello world')
    expect(truncateString('hello world', 11)).toEqual('hello world')
  })
})
