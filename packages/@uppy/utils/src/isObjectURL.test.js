const isObjectURL = require('./isObjectURL')

describe('isObjectURL', () => {
  it('should return true if the specified url is an object url', () => {
    expect(isObjectURL('blob:abc123')).toEqual(true)
    expect(isObjectURL('kblob:abc123')).toEqual(false)
    expect(isObjectURL('blob-abc123')).toEqual(false)
    expect(isObjectURL('abc123')).toEqual(false)
  })
})
