const limitPromises = require('./limitPromises')

describe('limitPromises', () => {
  let pending = 0
  function fn () {
    pending++
    return new Promise((resolve) => setTimeout(resolve, 10))
        .then(() => pending--)
  }

  it('should run at most N promises at the same time', () => {
    const limit = limitPromises(4)
    const fn2 = limit(fn)

    const result = Promise.all([
      fn2(), fn2(), fn2(), fn2(),
      fn2(), fn2(), fn2(), fn2(),
      fn2(), fn2()
    ])

    expect(pending).toBe(4)
    setTimeout(() => {
      expect(pending).toBe(4)
    }, 10)

    return result.then(() => {
      expect(pending).toBe(0)
    })
  })

  it('should accept Infinity as limit', () => {
    const limit = limitPromises(Infinity)
    const fn2 = limit(fn)

    const result = Promise.all([
      fn2(), fn2(), fn2(), fn2(),
      fn2(), fn2(), fn2(), fn2(),
      fn2(), fn2()
    ])

    expect(pending).toBe(10)

    return result.then(() => {
      expect(pending).toBe(0)
    })
  })
})
