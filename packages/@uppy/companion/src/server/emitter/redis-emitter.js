const redis = require('redis')

/**
 * This module simulates the builtin events.EventEmitter but with the use of redis.
 * This is useful for when companion is running on multiple instances and events need
 * to be distributed across.
 */
module.exports = (redisUrl, redisPubSubScope) => {
  const prefix = redisPubSubScope ? `${redisPubSubScope}:` : ''
  const publisher = redis.createClient({ url: redisUrl })
  let subscriber

  const connectedPromise = publisher.connect().then(() => {
    subscriber = publisher.duplicate()
    return subscriber.connect()
  })

  const errorHandlers = new Set()
  function errorHandler (err) {
    if (errorHandlers.size === 0) {
      Promise.reject(err) // trigger unhandled rejection if there are no error handlers.
    }
    for (const handler of errorHandlers) {
      handler(err)
    }
  }
  let runWhenConnected = (fn) => {
    connectedPromise.then(fn).catch(errorHandler)
  }
  connectedPromise.then(() => {
    runWhenConnected = fn => fn().catch(errorHandler)
  }, (err) => {
    runWhenConnected = () => errorHandler(err)
  })

  function on (eventName, handler) {
    function pMessageHandler (message, _channel, pattern) {
      if (prefix + eventName === pattern) {
        let jsonMsg = message
        try {
          jsonMsg = JSON.parse(message)
        } catch (ex) {
          if (typeof errorHandler === 'function') {
            return errorHandler(`Invalid JSON received! Channel: ${eventName} Message: ${message}`)
          }
        }
        return handler(jsonMsg, _channel)
      }
      return undefined
    }

    runWhenConnected(() => subscriber.pSubscribe(prefix + eventName, pMessageHandler))
  }

  /**
   * Add a one-off event listener
   *
   * @param {string} eventName name of the event
   * @param {Function} handler the handler of the event
   */
  function once (eventName, handler) {
    const actualHandler = (message) => {
      handler(message)
      removeListener(eventName, actualHandler)
    }
    on(eventName, actualHandler)
  }

  /**
   * Announce the occurence of an event
   *
   * @param {string} eventName name of the event
   * @param {object} message the message to pass along with the event
   */
  function emit (eventName, message) {
    runWhenConnected(() => publisher.publish(prefix + eventName, message))
  }

  /**
   * Remove an event listener
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event to remove
   */
  function removeListener (eventName, handler) {
    runWhenConnected(() => subscriber.pUnsubscribe(`${prefix}${eventName}`, handler))
  }

  /**
   * Remove all listeners of an event
   *
   * @param {string} eventName name of the event
   */
  function removeAllListeners (eventName) {
    runWhenConnected(() => subscriber.pUnsubscribe(`${prefix}${eventName}`))
  }

  return {
    on,
    once,
    emit,
    removeListener,
    removeAllListeners,
  }
}
