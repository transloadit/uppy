import { EventEmitter } from 'node:events'
import safeStringify from 'fast-safe-stringify'
import type { Redis } from 'ioredis'
import * as logger from '../logger.js'

function replacer(key: string, value: unknown): unknown {
  // Remove the circular structure and internal ones
  return key[0] === '_' || value === '[Circular]' ? undefined : value
}

/**
 * This module simulates the builtin events.EventEmitter but with the use of redis.
 * This is useful for when companion is running on multiple instances and events need
 * to be distributed across.
 *
 * @param redisClient
 * @param redisPubSubScope
 */
export default function redisEmitter(
  redisClient: Redis,
  redisPubSubScope?: string,
) {
  const prefix = redisPubSubScope ? `${redisPubSubScope}:` : ''
  const getPrefixedEventName = (eventName: string) => `${prefix}${eventName}`

  const errorEmitter = new EventEmitter()
  const handleError = (err: unknown) => errorEmitter.emit('error', err)

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
   * @param fn
   */
  async function runWhenConnected(
    fn: (clients: { subscriber: Redis; publisher: Redis }) => unknown,
  ): Promise<void> {
    try {
      await fn(await redisPromise)
    } catch (err) {
      handleError(err)
    }
  }

  // because each event can have multiple listeners, we need to keep track of them
  const handlersByEventName: Map<
    string,
    Map<(...args: unknown[]) => unknown, (...args: unknown[]) => unknown>
  > = new Map()

  /**
   * Remove an event listener
   *
   * @param eventName name of the event
   * @param handler the handler of the event to remove
   */
  type Handler = (...args: unknown[]) => unknown

  async function removeListener(eventName: string, handler: Handler) {
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
   * @param eventName
   * @param handler
   * @param _once
   */
  async function addListener(
    eventName: string,
    handler: Handler,
    _once = false,
  ) {
    if (eventName === 'error') {
      if (_once) errorEmitter.once('error', handler)
      else errorEmitter.addListener('error', handler)
      return
    }

    function actualHandler(pattern: string, _channel: string, message: string) {
      if (pattern !== getPrefixedEventName(eventName)) {
        return
      }

      if (_once) removeListener(eventName, handler)
      let args: unknown[]
      try {
        const parsed: unknown = JSON.parse(message)
        if (!Array.isArray(parsed)) {
          throw new Error('Expected JSON array')
        }
        args = parsed
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
   * @param eventName name of the event
   * @param handler the handler of the event
   */
  async function on(eventName: string, handler: Handler) {
    await addListener(eventName, handler)
  }

  /**
   * Remove an event listener
   *
   * @param eventName name of the event
   * @param handler the handler of the event
   */
  async function off(eventName: string, handler: Handler) {
    await removeListener(eventName, handler)
  }

  /**
   * Add an event listener (will be triggered at most once)
   *
   * @param eventName name of the event
   * @param handler the handler of the event
   */
  async function once(eventName: string, handler: Handler) {
    await addListener(eventName, handler, true)
  }

  /**
   * Announce the occurrence of an event
   *
   * @param eventName name of the event
   */
  async function emit(eventName: string, ...args: unknown[]) {
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
   * @param eventName name of the event
   */
  async function removeAllListeners(eventName: string) {
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
