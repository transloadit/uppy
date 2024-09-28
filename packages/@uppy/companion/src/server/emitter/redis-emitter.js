const { EventEmitter } = require('node:events')
const { default: safeStringify } = require('fast-safe-stringify')

const logger = require('../logger')

function replacer(key, value) {
  // Remove the circular structure and internal ones
  return key[0] === '_' || value === '[Circular]' ? undefined : value
}

/**
 * This module simulates the builtin events.EventEmitter but with the use of redis.
 * This is useful for when companion is running on multiple instances and events need
 * to be distributed across.
 * 
 * @param {import('ioredis').Redis} redisClient 
 * @param {string} redisPubSubScope 
 * @returns 
 */
module.exports = (redisClient, redisPubSubScope) => {
  const prefix = redisPubSubScope ? `${redisPubSubScope}:` : ''
  const getPrefixedEventName = (eventName) => `${prefix}${eventName}`

  const errorEmitter = new EventEmitter()
  const handleError = (err) => errorEmitter.emit('error', err)

  async function makeRedis() {
    const publisher = redisClient.duplicate({ lazyConnect: true })
    publisher.on('error', err => logger.error('publisher redis error', err.toString()))
    const subscriber = publisher.duplicate()
    subscriber.on('error', err => logger.error('subscriber redis error', err.toString()))
    await publisher.connect()
    await subscriber.connect()
    return { subscriber, publisher }
  }

  const redisPromise = makeRedis()
  redisPromise.catch((err) => handleError(err))

  /**
   * 
   * @param {(a: Awaited<typeof redisPromise>) => void} fn 
   */
  async function runWhenConnected (fn) {
    try {
      await fn(await redisPromise)
    } catch (err) {
      handleError(err)
    }
  }

  /** @type {Map<string, Map<() => unknown, () => unknown>>} */
  const handlersByEvent = new Map()

  /**
   * Remove an event listener
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event to remove
   */
  async function removeListener (eventName, handler) {
    if (eventName === 'error') {
      errorEmitter.removeListener('error', handler)
      return
    }

    const thisEventNameActualHandlerByHandler = handlersByEvent.get(eventName)
    if (thisEventNameActualHandlerByHandler == null) return

    const actualHandler = thisEventNameActualHandlerByHandler.get(handler)
    if (actualHandler == null) return

    thisEventNameActualHandlerByHandler.delete(handler)

    const didRemoveLastListener = thisEventNameActualHandlerByHandler.size === 0
    if (didRemoveLastListener) {
      handlersByEvent.delete(eventName)
    }

    await runWhenConnected(async ({ subscriber }) => {
      subscriber.off('pmessage', actualHandler)
      if (didRemoveLastListener) {
        await subscriber.punsubscribe(getPrefixedEventName(eventName))
      }
    })
  }

  /**
   * 
   * @param {string} eventName 
   * @param {*} handler 
   * @param {*} _once 
   */
  async function addListener (eventName, handler, _once = false) {
    if (eventName === 'error') {
      if (_once) errorEmitter.once('error', handler)
      else errorEmitter.addListener('error', handler)
      return
    }

    function actualHandler (pattern, channel, message) {
      if (pattern !== getPrefixedEventName(eventName)) {
        return
      }

      if (_once) removeListener(eventName, handler)
      let args
      try {
        args = JSON.parse(message)
      } catch (ex) {
        handleError(new Error(`Invalid JSON received! Channel: ${eventName} Message: ${message}`))
        return
      }

      handler(...args)
    }

    let thisEventNameActualHandlerByHandler = handlersByEvent.get(eventName)
    if (thisEventNameActualHandlerByHandler == null) {
      thisEventNameActualHandlerByHandler = new Map()
      handlersByEvent.set(eventName, thisEventNameActualHandlerByHandler)
    }
    thisEventNameActualHandlerByHandler.set(handler, actualHandler)

    await runWhenConnected(async ({ subscriber }) => {
      subscriber.on('pmessage', actualHandler)
      await subscriber.psubscribe(getPrefixedEventName(eventName))
    })
  }

  /**
   * Add an event listener
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event
   */
  async function on (eventName, handler) {
    await addListener(eventName, handler)
  }

  /**
   * Remove an event listener
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event
   */
  async function off (eventName, handler) {
    await removeListener(eventName, handler)
  }

  /**
   * Add an event listener (will be triggered at most once)
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event
   */
  async function once (eventName, handler) {
    await addListener(eventName, handler, true)
  }

  /**
   * Announce the occurrence of an event
   *
   * @param {string} eventName name of the event
   */
  async function emit (eventName, ...args) {
    await runWhenConnected(async ({ publisher }) => (
      publisher.publish(getPrefixedEventName(eventName), safeStringify(args, replacer))
    ))
  }

  /**
   * Remove all listeners of an event
   *
   * @param {string} eventName name of the event
   */
  async function removeAllListeners (eventName) {
    if (eventName === 'error') {
      errorEmitter.removeAllListeners(eventName)
      return
    }

    const thisEventNameActualHandlerByHandler = handlersByEvent.get(eventName)
    if (thisEventNameActualHandlerByHandler != null) {
      for (const handler of thisEventNameActualHandlerByHandler.keys()) {
        await removeListener(eventName, handler)
      }
    }
  }

  return {
    on,
    off,
    once,
    emit,
    removeListener,
    removeAllListeners,
  }
}
