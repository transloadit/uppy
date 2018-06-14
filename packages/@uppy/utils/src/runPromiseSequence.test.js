const runPromiseSequence = require('./runPromiseSequence')

describe('runPromiseSequence', () => {
  it('should run an array of promise-returning functions in sequence', () => {
    const promiseFn1 = jest.fn().mockReturnValue(Promise.resolve)
    const promiseFn2 = jest.fn().mockReturnValue(Promise.resolve)
    const promiseFn3 = jest.fn().mockReturnValue(Promise.resolve)
    return runPromiseSequence([promiseFn1, promiseFn2, promiseFn3])
        .then(() => {
          expect(promiseFn1.mock.calls.length).toEqual(1)
          expect(promiseFn2.mock.calls.length).toEqual(1)
          expect(promiseFn3.mock.calls.length).toEqual(1)
        })
  })
})
