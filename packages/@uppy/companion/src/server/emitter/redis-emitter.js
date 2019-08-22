// @ts-ignore
const NRP = require('node-redis-pubsub')

/**
 * This class simulates the builtin events.EventEmitter but with the use of redis.
 * This is useful for when companion is running on multiple instances and events need
 * to be distributed across.
 */
class RedisEmitter extends NRP {
  /**
   *
   * @param {string} redisUrl redis URL
   */
  constructor (redisUrl) {
    // @ts-ignore
    super({ url: redisUrl })
  }

  /**
   * Add a one-off event listener
   * @param {string} eventName name of the event
   * @param {function} handler the handler of the event
   */
  once (eventName, handler) {
    const removeListener = this.on(eventName, (message) => {
      handler(message)
      removeListener()
    })
  }

  /**
   * Announce the occurence of an event
   * @param {string} eventName name of the event
   * @param {object} message the message to pass along with the event
   */
  emit (eventName, message) {
    return super.emit(eventName, message || {})
  }

  /**
   * Remove an event listener
   * @param {string} eventName name of the event
   * @param {function} handler the handler of the event to remove
   */
  removeListener (eventName, handler) {
    this.receiver.removeListener(eventName, handler)
    this.receiver.punsubscribe(this.prefix + eventName)
  }

  /**
   * Remove all listeners of an event
   * @param {string} eventName name of the event
   */
  removeAllListeners (eventName) {
    this.receiver.removeAllListeners(eventName)
    this.receiver.punsubscribe(this.prefix + eventName)
  }
}

module.exports = (redisUrl) => {
  return new RedisEmitter(redisUrl)
}
