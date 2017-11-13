module.exports = class DefaultStore {
  constructor () {
    this.state = {}
    this.callbacks = []
  }

  getState () {
    return this.state
  }

  setState (patch) {
    const prevState = Object.assign({}, this.state)
    const nextState = Object.assign({}, this.state, patch)

    this.state = nextState
    this._publish(prevState, nextState, patch)
  }

  subscribe (listener) {
    this.callbacks.push(listener)
    return () => {
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
