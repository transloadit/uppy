const createSuperFocus = require('./createSuperFocus')

describe('createSuperFocus', () => {
  // superFocus.cancel() is used in dashboard
  it('should return a function that can be cancelled', () => {
    const superFocus = createSuperFocus()
    expect(typeof superFocus).toBe('function')
    expect(typeof superFocus.cancel).toBe('function')
  })
})
