import deepFreeze from 'deep-freeze'

/**
 * Default store + deepFreeze on setState to make sure nothing is mutated accidentally
 */
class DeepFrozenStore {
  constructor() {
    this.state = {}
    this.callbacks = []
  }

  getState() {
    return this.state
  }

  setState(patch) {
    const prevState = { ...this.state }
    const nextState = deepFreeze({ ...this.state, ...patch })

    this.state = nextState
    this._publish(prevState, nextState, patch)
  }

  subscribe(listener) {
    this.callbacks.push(listener)
    return () => {
      // Remove the listener.
      this.callbacks.splice(this.callbacks.indexOf(listener), 1)
    }
  }

  _publish(...args) {
    this.callbacks.forEach((listener) => {
      listener(...args)
    })
  }
}

export default function defaultStore() {
  return new DeepFrozenStore()
}
