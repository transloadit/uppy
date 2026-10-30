import { EventEmitter } from 'node:events'
import safeStringify from 'fast-safe-stringify'
import type { Redis } from 'ioredis'
import { toError } from '../helpers/type-guards.js'
import * as logger from '../logger.js'
import type { EmitterLike } from './index.js'

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
): EmitterLike {
  const prefix = redisPubSubScope ? `${redisPubSubScope}:` : ''
  const getPrefixedEventName = (eventName: string) => `${prefix}${eventName}`

  const errorEmitter = new EventEmitter()
  // Redis errors carry their command's arguments, which name the channel and
  // so its token: pass on only the name and message.
  const describe = (err: unknown): string => {
    const { name, message } = toError(err)
    // a failed connect is an AggregateError of one error per address tried
    if (err instanceof AggregateError) {
      return `${name}: ${err.errors.map(describe).join('; ')}`
    }
    return `${name}: ${message}`
  }
  // Fail the call that ran the command, and hand the error to 'error'
  // listeners (an import waiting for its socket listens), so nobody waits for
  // an event that cannot arrive.
  const handleError = (err: unknown): never => {
    const error = new Error(`Redis pub/sub failed: ${describe(err)}`)
    logger.error(error.message, 'redis.emitter.error')
    if (errorEmitter.listenerCount('error') > 0)
      errorEmitter.emit('error', error)
    throw error
  }

  // Event names end in an upload or auth-callback token; log only its start,
  // as Uploader.shortenToken does.
  const shortEventName = (eventName: string) =>
    eventName.replace(/[^:]*$/, (token) => token.slice(0, 8))

  // ioredis connects on the first command, queues commands while it
  // (re)connects and fails them after maxRetriesPerRequest, so a Redis that is
  // down at startup or restarts later needs no handling here. That holds while
  // retryStrategy keeps retrying: one that returns null ends the client, and
  // every later call fails.
  const publisher = redisClient.duplicate({ lazyConnect: true })
  publisher.on('error', (err) =>
    logger.error(`publisher redis error: ${describe(err)}`),
  )
  const subscriber = publisher.duplicate()
  subscriber.on('error', (err) =>
    logger.error(`subscriber redis error: ${describe(err)}`),
  )

  async function runWhenConnected(
    fn: (clients: { subscriber: Redis; publisher: Redis }) => unknown,
  ): Promise<void> {
    try {
      await fn({ subscriber, publisher })
    } catch (err) {
      handleError(err)
    }
  }

  // events.once() and fire-and-forget callers don't await these calls: a
  // failure must not become an unhandled rejection. Awaiting callers still
  // see it.
  const handled = <T>(promise: Promise<T>) => {
    promise.catch(() => {})
    return promise
  }

  // because each event can have multiple listeners, we need to keep track of them
  const handlersByEventName: Map<
    string,
    Map<
      (...args: unknown[]) => unknown,
      (pattern: string, _channel: string, message: string) => unknown
    >
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

      let args: unknown[]
      try {
        const parsed: unknown = JSON.parse(message)
        if (!Array.isArray(parsed)) {
          throw new Error('Expected JSON array')
        }
        args = parsed
      } catch (_ex) {
        // Not something emit() published. Drop it: as an 'error' it would
        // fail every import waiting on the emitter.
        logger.warn(
          `Dropped a message that is not a JSON array on ${shortEventName(eventName)}`,
          'redis.emitter.invalid.message',
        )
        return
      }

      if (_once) handled(removeListener(eventName, handler))
      handler(...args)
    }

    let actualHandlerByHandler = handlersByEventName.get(eventName)
    if (actualHandlerByHandler == null) {
      actualHandlerByHandler = new Map()
      handlersByEventName.set(eventName, actualHandlerByHandler)
    }
    const handlers = actualHandlerByHandler
    handlers.set(handler, actualHandler)

    await runWhenConnected(async ({ subscriber }) => {
      subscriber.on('pmessage', actualHandler)
      try {
        await subscriber.psubscribe(getPrefixedEventName(eventName))
      } catch (err) {
        // a failed on() must leave no listener behind
        subscriber.off('pmessage', actualHandler)
        if (handlers.get(handler) === actualHandler) {
          handlers.delete(handler)
          if (handlers.size === 0) handlersByEventName.delete(eventName)
        }
        throw err
      }
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
    on: (eventName, handler) => handled(on(eventName, handler)),
    off: (eventName, handler) => handled(off(eventName, handler)),
    once: (eventName, handler) => handled(once(eventName, handler)),
    emit: (eventName, ...args) => handled(emit(eventName, ...args)),
    removeListener: (eventName, handler) =>
      handled(removeListener(eventName, handler)),
    removeAllListeners: (eventName) => handled(removeAllListeners(eventName)),
  }
}
