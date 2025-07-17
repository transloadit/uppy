import { EventEmitter } from 'node:events'
import safeStringify from 'fast-safe-stringify'
import * as logger from '../logger.js'

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
export default function redisEmitter(redisClient, redisPubSubScope) {
  const prefix = redisPubSubScope ? `${redisPubSubScope}:` : ''
  const getPrefixedEventName = (eventName) => `${prefix}${eventName}`

  const errorEmitter = new EventEmitter()
  const handleError = (err) => errorEmitter.emit('error', err)

  async function makeRedis() {
    const publisher = redisClient.duplicate({ lazyConnect: true })
    publisher.on('error', (err) =>
      logger.error('publisher redis error', err.toString()),
    )
    const subscriber = publisher.duplicate()
    subscriber.on('error', (err) =>
      logger.error('subscriber redis error', err.toString()),
    )
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
  async function runWhenConnected(fn) {
    try {
      await fn(await redisPromise)
    } catch (err) {
      handleError(err)
    }
  }

  // because each event can have multiple listeners, we need to keep track of them
  /** @type {Map<string, Map<() => unknown, () => unknown>>} */
  const handlersByEventName = new Map()

  /**
   * Remove an event listener
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event to remove
   */
  async function removeListener(eventName, handler) {
    if (eventName === 'error') {
      errorEmitter.removeListener('error', handler)
      return
    }

    const actualHandlerByHandler = handlersByEventName.get(eventName)
    if (actualHandlerByHandler == null) return

    const actualHandler = actualHandlerByHandler.get(handler)
    if (actualHandler == null) return

    actualHandlerByHandler.delete(handler)

    const didRemoveLastListener = actualHandlerByHandler.size === 0
    if (didRemoveLastListener) {
      handlersByEventName.delete(eventName)
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
  async function addListener(eventName, handler, _once = false) {
    if (eventName === 'error') {
      if (_once) errorEmitter.once('error', handler)
      else errorEmitter.addListener('error', handler)
      return
    }

    function actualHandler(pattern, channel, message) {
      if (pattern !== getPrefixedEventName(eventName)) {
        return
      }

      if (_once) removeListener(eventName, handler)
      let args
      try {
        args = JSON.parse(message)
      } catch (_ex) {
        handleError(
          new Error(
            `Invalid JSON received! Channel: ${eventName} Message: ${message}`,
          ),
        )
        return
      }

      handler(...args)
    }

    let actualHandlerByHandler = handlersByEventName.get(eventName)
    if (actualHandlerByHandler == null) {
      actualHandlerByHandler = new Map()
      handlersByEventName.set(eventName, actualHandlerByHandler)
    }
    actualHandlerByHandler.set(handler, actualHandler)

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
  async function on(eventName, handler) {
    await addListener(eventName, handler)
  }

  /**
   * Remove an event listener
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event
   */
  async function off(eventName, handler) {
    await removeListener(eventName, handler)
  }

  /**
   * Add an event listener (will be triggered at most once)
   *
   * @param {string} eventName name of the event
   * @param {any} handler the handler of the event
   */
  async function once(eventName, handler) {
    await addListener(eventName, handler, true)
  }

  /**
   * Announce the occurrence of an event
   *
   * @param {string} eventName name of the event
   */
  async function emit(eventName, ...args) {
    await runWhenConnected(async ({ publisher }) =>
      publisher.publish(
        getPrefixedEventName(eventName),
        safeStringify.default(args, replacer),
      ),
    )
  }

  /**
   * Remove all listeners of an event
   *
   * @param {string} eventName name of the event
   */
  async function removeAllListeners(eventName) {
    if (eventName === 'error') {
      errorEmitter.removeAllListeners(eventName)
      return
    }

    const actualHandlerByHandler = handlersByEventName.get(eventName)
    if (actualHandlerByHandler != null) {
      for (const handler of actualHandlerByHandler.keys()) {
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
