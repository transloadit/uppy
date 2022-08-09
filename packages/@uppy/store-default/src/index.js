import packageJson from '../package.json'
/**
 * Default store that keeps state in a simple object.
 */
class DefaultStore {
  static VERSION = packageJson.version

  #callbacks = new Set()

  constructor () {
    this.state = {}
  }

  getState () {
    return this.state
  }

  setState (patch) {
    const prevState = { ...this.state }
    const nextState = { ...this.state, ...patch }

    this.state = nextState
    this.#publish(prevState, nextState, patch)
  }

  subscribe (listener) {
    this.#callbacks.add(listener)
    return () => {
      this.#callbacks.delete(listener)
    }
  }

  #publish (...args) {
    this.#callbacks.forEach((listener) => {
      listener(...args)
    })
  }
}

export default DefaultStore
