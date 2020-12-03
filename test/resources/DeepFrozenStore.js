var deepFreeze = require('deep-freeze')

/**
 * Default store + deepFreeze on setState to make sure nothing is mutated accidentally
 */
class DeepFrozenStore {
  constructor () {
    this.state = {}
    this.callbacks = []
  }

  getState () {
    return this.state
  }

  setState (patch) {
    const prevState = Object.assign({}, this.state)
    const nextState = deepFreeze(Object.assign({}, this.state, patch))

    this.state = nextState
    this._publish(prevState, nextState, patch)
  }

  subscribe (listener) {
    this.callbacks.push(listener)
    return () => {
      // Remove the listener.
      this.callbacks.splice(
        this.callbacks.indexOf(listener),
        1
      )
    }
  }

  _publish (...args) {
    this.callbacks.forEach((listener) => {
      listener(...args)
    })
  }
}

module.exports = function defaultStore () {
  return new DeepFrozenStore()
}
