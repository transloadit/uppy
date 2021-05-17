const NRP = require('node-redis-pubsub')

/**
 * This module simulates the builtin events.EventEmitter but with the use of redis.
 * This is useful for when companion is running on multiple instances and events need
 * to be distributed across.
 */
module.exports = (redisUrl, redisPubSubScope) => {
  const nrp = new NRP({ url: redisUrl, scope: redisPubSubScope })

  function on (eventName, handler) {
    nrp.on(eventName, handler)
  }

  /**
   * Add a one-off event listener
   *
   * @param {string} eventName name of the event
   * @param {Function} handler the handler of the event
   */
  function once (eventName, handler) {
    const off = nrp.on(eventName, (message) => {
      handler(message)
      off()
    })
  }

  /**
   * Announce the occurence of an event
   *
   * @param {string} eventName name of the event
   * @param {object} message the message to pass along with the event
   */
  function emit (eventName, message) {
    return nrp.emit(eventName, message || {})
  }

  /**
   * Remove an event listener
   *
   * @param {string} eventName name of the event
   * @param {Function} handler the handler of the event to remove
   */
  function removeListener (eventName, handler) {
    nrp.receiver.removeListener(eventName, handler)
    nrp.receiver.punsubscribe(`${nrp.prefix}${eventName}`)
  }

  /**
   * Remove all listeners of an event
   *
   * @param {string} eventName name of the event
   */
  function removeAllListeners (eventName) {
    nrp.receiver.removeAllListeners(eventName)
    nrp.receiver.punsubscribe(`${nrp.prefix}${eventName}`)
  }

  return {
    on,
    once,
    emit,
    removeListener,
    removeAllListeners,
  }
}
