import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import isTouchDevice from './isTouchDevice.ts'

describe('isTouchDevice', () => {
  const RealTouchStart = globalThis.window.ontouchstart
  const RealMaxTouchPoints = globalThis.navigator.maxTouchPoints

  beforeEach(() => {
    globalThis.window.ontouchstart = true
    globalThis.navigator.maxTouchPoints = 1
  })

  afterEach(() => {
    globalThis.navigator.maxTouchPoints = RealMaxTouchPoints
    globalThis.window.ontouchstart = RealTouchStart
  })

  it.skip("should return true if it's a touch device", () => {
    expect(isTouchDevice()).toEqual(true)
    delete globalThis.window.ontouchstart
    globalThis.navigator.maxTouchPoints = false
    expect(isTouchDevice()).toEqual(false)
  })
})
