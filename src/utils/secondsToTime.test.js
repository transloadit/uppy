const secondsToTime = require('./secondsToTime')

describe('secondsToTime', () => {
  it('converts seconds to an { hours, minutes, seconds } object', () => {
    expect(secondsToTime(60)).toEqual({
      hours: 0,
      minutes: 1,
      seconds: 0
    })

    expect(secondsToTime(123)).toEqual({
      hours: 0,
      minutes: 2,
      seconds: 3
    })

    expect(secondsToTime(1060)).toEqual({
      hours: 0,
      minutes: 17,
      seconds: 40
    })

    expect(secondsToTime(123453460)).toEqual({
      hours: 20,
      minutes: 37,
      seconds: 40
    })
  })
})
