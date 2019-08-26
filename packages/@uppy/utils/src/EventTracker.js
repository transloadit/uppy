/**
 * Create a wrapper around an event emitter with a `remove` method to remove
 * all events that were added using the wrapped emitter.
 */
module.exports = class EventTracker {
  constructor (emitter) {
    this._events = []
    this._emitter = emitter
  }

  on (event, fn) {
    this._events.push([event, fn])
    return this._emitter.on(event, fn)
  }

  remove () {
    this._events.forEach(([event, fn]) => {
      this._emitter.off(event, fn)
    })
  }
}
