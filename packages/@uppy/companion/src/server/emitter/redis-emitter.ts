import { EventEmitter } from 'node:events'
import safeStringify from 'fast-safe-stringify'
import type { Redis } from 'ioredis'
import * as logger from '../logger.js'
import type { EmitterLike } from './index.js'

function replacer(key: string, value: unknown): unknown {
  // Remove the circular structure and internal ones
  return key[0] === '_' || value === '[Circular]' ? undefined : value
}

/**
 * Backslash-escape the glob characters of a Redis PSUBSCRIBE pattern so an
 * event name can only ever match itself.
 */
export function escapeGlob(name: string): string {
  return name.replace(/[\\*?[\]]/g, '\\$&')
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
): EmitterLike {
  const prefix = redisPubSubScope ? `${redisPubSubScope}:` : ''
  // literal channel, used for publishing
  const getChannelName = (eventName: string) => `${prefix}${eventName}`
  // escaped pattern, used for (p)subscribing and matching
  const getPatternName = (eventName: string) =>
    `${prefix}${escapeGlob(eventName)}`

  const errorEmitter = new EventEmitter()
  function handleError(err: unknown) {
    // Redis command errors can contain credentials and private channel names.
    logger.error('Redis emitter operation failed', 'emitter.redis.error')
    if (errorEmitter.listenerCount('error') > 0) errorEmitter.emit('error', err)
  }

  type Handler = (...args: unknown[]) => unknown
  const handlersByPattern = new Map<string, Map<Handler, boolean>>()

  function dispatch(pattern: string, _channel: string, message: string) {
    const handlers = handlersByPattern.get(pattern)
    if (!handlers) return
    let args: unknown
    try {
      args = JSON.parse(message)
      if (!Array.isArray(args)) throw new Error('Expected JSON array')
    } catch {
      handleError(new Error('Invalid Redis event payload'))
      return
    }
    for (const [handler, once] of [...handlers]) {
      if (once) void removeListenerByPattern(pattern, handler)
      try {
        Promise.resolve(handler(...args)).catch(handleError)
      } catch (err) {
        handleError(err)
      }
    }
  }

  async function makeRedis() {
    const publisher = redisClient.duplicate({ lazyConnect: true })
    publisher.on('error', (err) =>
      logger.error('publisher redis error', err.toString()),
    )
    const subscriber = publisher.duplicate()
    // One lookup per message, independent of unrelated upload sockets.
    subscriber.on('pmessage', dispatch)
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

  /**
   * Remove an event listener
   *
   * @param eventName name of the event
   * @param handler the handler of the event to remove
   */
  async function removeListener(eventName: string, handler: Handler) {
    if (eventName === 'error') {
      errorEmitter.removeListener('error', handler)
      return
    }

    await removeListenerByPattern(getPatternName(eventName), handler)
  }

  async function removeListenerByPattern(pattern: string, handler: Handler) {
    const handlers = handlersByPattern.get(pattern)
    if (!handlers?.delete(handler) || handlers.size > 0) return
    handlersByPattern.delete(pattern)
    await runWhenConnected(async ({ subscriber }) => {
      // A listener may have rejoined while the Redis connection was opening.
      if (!handlersByPattern.has(pattern))
        await subscriber.punsubscribe(pattern)
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

    const pattern = getPatternName(eventName)
    let handlers = handlersByPattern.get(pattern)
    if (!handlers) {
      handlers = new Map()
      handlersByPattern.set(pattern, handlers)
    }
    handlers.set(handler, _once)

    await runWhenConnected(async ({ subscriber }) => {
      if (handlersByPattern.has(pattern)) await subscriber.psubscribe(pattern)
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
        getChannelName(eventName),
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

    const handlers = handlersByPattern.get(getPatternName(eventName))
    if (handlers != null) {
      for (const handler of handlers.keys()) {
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
