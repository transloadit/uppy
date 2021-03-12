const toArray = require('./toArray')

describe('toArray', () => {
  it('should convert a array-like object into an array', () => {
    const obj = {
      0: 'zero',
      1: 'one',
      2: 'two',
      3: 'three',
      4: 'four',
      length: 5
    }

    expect(toArray(obj)).toEqual([
      'zero',
      'one',
      'two',
      'three',
      'four'
    ])
  })
})
