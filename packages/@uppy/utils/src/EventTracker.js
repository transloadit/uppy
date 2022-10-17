/**
 * Create a wrapper around an event emitter with a `remove` method to remove
 * all events that were added using the wrapped emitter.
 */
export default class EventTracker {
  #emitter

  #events = []

  constructor (emitter) {
    this.#emitter = emitter
  }

  on (event, fn) {
    this.#events.push([event, fn])
    return this.#emitter.on(event, fn)
  }

  remove () {
    for (const [event, fn] of this.#events.splice(0)) {
      this.#emitter.off(event, fn)
    }
  }
}
