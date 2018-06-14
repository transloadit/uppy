const isTouchDevice = require('./isTouchDevice')

describe('isTouchDevice', () => {
  const RealTouchStart = global.window.ontouchstart
  const RealMaxTouchPoints = global.navigator.maxTouchPoints

  beforeEach(() => {
    global.window.ontouchstart = true
    global.navigator.maxTouchPoints = 1
  })

  afterEach(() => {
    global.navigator.maxTouchPoints = RealMaxTouchPoints
    global.window.ontouchstart = RealTouchStart
  })

  xit("should return true if it's a touch device", () => {
    expect(isTouchDevice()).toEqual(true)
    delete global.window.ontouchstart
    global.navigator.maxTouchPoints = false
    expect(isTouchDevice()).toEqual(false)
  })
})
