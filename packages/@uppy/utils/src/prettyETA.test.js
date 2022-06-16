import { describe, expect, it } from '@jest/globals'
import prettyETA from './prettyETA.js'

describe('prettyETA', () => {
  it('should convert the specified number of seconds to a pretty ETA', () => {
    expect(prettyETA(0)).toEqual('0s')
    expect(prettyETA(1.2)).toEqual('1s')
    expect(prettyETA(1)).toEqual('1s')
    expect(prettyETA(63)).toEqual('1m 03s')
    expect(prettyETA(103)).toEqual('1m 43s')
    expect(prettyETA(1034.9)).toEqual('17m 14s')
    expect(prettyETA(3600)).toEqual('1h')
    expect(prettyETA(3660)).toEqual('1h 01m')
    expect(prettyETA(103984.1)).toEqual('4h 53m')
  })
})
