import { describe, expect, it } from 'vitest'
import formatSeconds from './formatSeconds.js'

describe('formatSeconds', () => {
  it("should return a value of '0:43' when an argument of 43 seconds is supplied", () => {
    expect(formatSeconds(43)).toEqual('0:43')
  })

  it("should return a value of '1:43' when an argument of 103 seconds is supplied", () => {
    expect(formatSeconds(103)).toEqual('1:43')
  })
})
