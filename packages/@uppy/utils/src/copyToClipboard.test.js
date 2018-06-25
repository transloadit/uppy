const copyToClipboard = require('./copyToClipboard')

describe('copyToClipboard', () => {
  xit('should copy the specified text to the clipboard', () => {
    expect(typeof copyToClipboard).toBe('function')
  })
})
