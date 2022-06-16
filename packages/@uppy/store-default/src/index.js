import packageJson from '../package.json'
/**
 * Default store that keeps state in a simple object.
 */
class DefaultStore {
  static VERSION = packageJson.version

  constructor () {
    this.state = {}
    this.callbacks = [] // TODO: use a Set instead, make it a private prop
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
    this.callbacks.push(listener)
    return () => {
      // Remove the listener.
      this.callbacks.splice(
        this.callbacks.indexOf(listener),
        1,
      )
    }
  }

  #publish (...args) {
    this.callbacks.forEach((listener) => {
      listener(...args)
    })
  }
}

// TODO: export the class instead in the next major.
export default function defaultStore () {
  return new DefaultStore()
}
