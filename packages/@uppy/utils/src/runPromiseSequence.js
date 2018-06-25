/**
 * Runs an array of promise-returning functions in sequence.
 */
module.exports = function runPromiseSequence (functions, ...args) {
  let promise = Promise.resolve()
  functions.forEach((func) => {
    promise = promise.then(() => func(...args))
  })
  return promise
}
