import { afterEach, beforeEach, describe, expect, xit } from '@jest/globals'
import isTouchDevice from './isTouchDevice.js'

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

  xit("should return true if it's a touch device", () => {
    expect(isTouchDevice()).toEqual(true)
    delete globalThis.window.ontouchstart
    globalThis.navigator.maxTouchPoints = false
    expect(isTouchDevice()).toEqual(false)
  })
})
