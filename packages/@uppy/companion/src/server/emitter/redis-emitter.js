const redis = require('redis')
const { EventEmitter } = require('node:events')

const logger = require('../logger')

/**
 * This module simulates the builtin events.EventEmitter but with the use of redis.
 * This is useful for when companion is running on multiple instances and events need
 * to be distributed across.
 */
module.exports = (redisUrl, redisPubSubScope) => {
  const prefix = redisPubSubScope ? `${redisPubSubScope}:` : ''
  const getPrefixedEventName = (eventName) => `${prefix}${eventName}`
  const publisher = redis.createClient({ url: redisUrl })
  publisher.on('error', err => logger.error('publisher redis error', err))
  let subscriber

  const connectedPromise = publisher.connect().then(() => {
    subscriber = publisher.duplicate()
    subscriber.on('error', err => logger.error('subscriber redis error', err))
    return subscriber.connect()
  })

  const handlersByEvent = new Map()

  const errorEmitter = new EventEmitter()
  const handleError = (err) => errorEmitter.emit('error', err)

  connectedPromise.catch((err) => handleError(err))

  async function runWhenConnected (fn) {
    try {
      await connectedPromise
      await fn()
    } catch (err) {
      handleError(err)
    }
  }

  function addListener (eventName, handler, _once = false) {
    function actualHandler (message) {
      if (_once) removeListener(eventName, handler)
      let args
      try {
        args = JSON.parse(message)
      } catch (ex) {
        return handleError(new Error(`Invalid JSON received! Channel: ${eventName} Message: ${message}`))
      }
      return handler(...args)
    }

    let handlersByThisEventName = handlersByEvent.get(eventName)
    if (handlersByThisEventName == null) {
      handlersByThisEventName = new WeakMap()
      handlersByEvent.set(eventName, handlersByThisEventName)
    }
    handlersByThisEventName.set(handler, actualHandler)

    runWhenConnected(() => subscriber.pSubscribe(getPrefixedEventName(eventName), actualHandler))
  }

  /**
   * Add an event listener
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event
   */
  function on (eventName, handler) {
    if (eventName === 'error') return errorEmitter.on('error', handler)

    return addListener(eventName, handler)
  }

  /**
   * Add an event listener (will be triggered at most once)
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event
   */
  function once (eventName, handler) {
    if (eventName === 'error') return errorEmitter.once('error', handler)

    return addListener(eventName, handler, true)
  }

  /**
   * Announce the occurence of an event
   *
   * @param {string} eventName name of the event
   */
  function emit (eventName, ...args) {
    runWhenConnected(() => publisher.publish(getPrefixedEventName(eventName), JSON.stringify(args)))
  }

  /**
   * Remove an event listener
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event to remove
   */
  function removeListener (eventName, handler) {
    if (eventName === 'error') return errorEmitter.removeListener('error', handler)

    return runWhenConnected(() => {
      const handlersByThisEventName = handlersByEvent.get(eventName)
      if (handlersByThisEventName == null) return undefined

      const actualHandler = handlersByThisEventName.get(handler)
      if (actualHandler == null) return undefined

      handlersByThisEventName.delete(handler)
      if (handlersByThisEventName.size === 0) handlersByEvent.delete(eventName)

      return subscriber.pUnsubscribe(getPrefixedEventName(eventName), actualHandler)
    })
  }

  /**
   * Remove all listeners of an event
   *
   * @param {string} eventName name of the event
   */
  function removeAllListeners (eventName) {
    if (eventName === 'error') return errorEmitter.removeAllListeners(eventName)

    return runWhenConnected(() => {
      handlersByEvent.delete(eventName)
      return subscriber.pUnsubscribe(getPrefixedEventName(eventName))
    })
  }

  return {
    on,
    once,
    emit,
    removeListener,
    removeAllListeners,
  }
}
