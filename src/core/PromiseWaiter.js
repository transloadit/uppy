/**
 * Wait for multiple Promises to resolve.
 */
module.exports = class PromiseWaiter {
  constructor () {
    this.promises = []
  }

  add (promise) {
    this.promises.push(promise)

    const remove = () => {
      this.remove(promise)
    }
    promise.then(remove, remove)
  }

  remove (promise) {
    const index = this.promises.indexOf(promise)
    if (index !== -1) {
      this.promises.splice(index, 1)
    }
  }

  wait () {
    const promises = this.promises
    this.promises = []

    function noop () {
      // No result value
    }

    // Just wait for a Promise to conclude in some way, whether it's resolution
    // or rejection. We don't care about the contents.
    function concluded (promise) {
      return promise.then(noop, noop)
    }

    return Promise.all(promises.map(concluded)).then(noop)
  }
}
