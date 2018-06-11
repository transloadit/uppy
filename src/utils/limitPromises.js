/**
 * Limit the amount of simultaneously pending Promises.
 * Returns a function that, when passed a function `fn`,
 * will make sure that at most `limit` calls to `fn` are pending.
 *
 * @param {number} limit
 * @return {function()}
 */
module.exports = function limitPromises (limit) {
  let pending = 0
  const queue = []
  return (fn) => {
    return (...args) => {
      const call = () => {
        pending++
        const promise = fn(...args)
        promise.then(onfinish, onfinish)
        return promise
      }

      if (pending >= limit) {
        return new Promise((resolve, reject) => {
          queue.push(() => {
            call().then(resolve, reject)
          })
        })
      }
      return call()
    }
  }
  function onfinish () {
    pending--
    const next = queue.shift()
    if (next) next()
  }
}
