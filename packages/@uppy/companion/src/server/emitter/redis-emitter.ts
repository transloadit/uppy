import type { Redis } from 'ioredis'

import type { EmitterLike } from './index.js'

import { EventEmitter } from 'node:events'

import safeStringify from 'fast-safe-stringify'

import { isRecord, toError } from '../helpers/type-guards.js'
import * as logger from '../logger.js'

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
 * The name and message of an error, and for a failed connect (an
 * AggregateError of one error per address tried) those of each address. Not
 * its other properties: a Redis command error carries the command's arguments.
 */
function describe(err: unknown): string {
  const { name, message } = toError(err)
  if (err instanceof AggregateError) {
    return `${name}: ${err.errors.map(describe).join('; ')}`
  }
  return `${name}: ${message}`
}

/**
 * What kind of error it was: its name, code and Redis error prefix (such as
 * NOPERM), and those of each address a failed connect tried. A Redis reply can
 * quote the command, which may hold credentials and private channel names, so
 * this leaves out the rest of the message.
 */
function errorKind(err: unknown): string {
  if (!isRecord(err)) return ''
  const message = err['message']
  const redisPrefix =
    typeof message === 'string' ? /^[A-Z]{2,}(?=\s|$)/.exec(message)?.[0] : ''
  const kind = [err['name'], err['code'], redisPrefix]
    .filter((v) => typeof v === 'string' && v !== '')
    .join(' ')
  if (err instanceof AggregateError) {
    return `${kind}: ${err.errors.map(errorKind).join('; ')}`
  }
  return kind
}

// Event names end in an upload or auth-callback token; log only its start,
// as Uploader.shortenToken does.
const shortEventName = (eventName: string) =>
  eventName.replace(/[^:]*$/, (token) => token.slice(0, 8))

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
  /**
   * Log a failure and hand it to 'error' listeners (an import waiting for its
   * socket listens), so nobody waits for an event that cannot arrive. The
   * listeners are shared, so one failed command fails every import that is
   * waiting, not only the one it belonged to. ioredis has given up retrying by
   * then, which means Redis is down for all of them.
   *
   * Returns the error to pass on: a new one with the name and message only,
   * as a Redis command error carries the command's arguments, which name the
   * channel and so its token.
   */
  function handleError(err: unknown): Error {
    const kind = errorKind(err)
    logger.error(
      `Redis emitter operation failed${kind ? ` (${kind})` : ''}`,
      'emitter.redis.error',
    )
    const error = new Error(`Redis pub/sub failed: ${describe(err)}`)
    if (errorEmitter.listenerCount('error') > 0)
      errorEmitter.emit('error', error)
    return error
  }

  /**
   * Callers that await see a failed Redis command as a rejection (a login must
   * not wait forever for a message that was never published), but one that
   * doesn't await must not crash the process with an unhandled rejection.
   */
  function handled<T>(promise: Promise<T>): Promise<T> {
    promise.catch(() => {})
    return promise
  }

  type Handler = (...args: unknown[]) => unknown
  // One entry per registration, so a failed on() removes only its own.
  type Registration = { once: boolean }
  const handlersByPattern = new Map<string, Map<Handler, Registration>>()

  function dispatch(pattern: string, _channel: string, message: string) {
    const handlers = handlersByPattern.get(pattern)
    if (!handlers) return
    let args: unknown
    try {
      args = JSON.parse(message)
      if (!Array.isArray(args)) throw new Error('Expected JSON array')
    } catch {
      // Not something emit() published. Drop it: as an 'error' it would fail
      // every import waiting on the emitter, and it must not use up a once().
      logger.warn(
        `Dropped a message that is not a JSON array on ${shortEventName(pattern)}`,
        'emitter.redis.invalid.message',
      )
      return
    }
    for (const [handler, { once }] of [...handlers]) {
      if (once) handled(removeListenerByPattern(pattern, handler))
      try {
        Promise.resolve(handler(...args)).catch(handleError)
      } catch (err) {
        handleError(err)
      }
    }
  }

  // ioredis connects on the first command, queues commands while it
  // (re)connects and fails them after maxRetriesPerRequest, and re-subscribes
  // after a reconnect, so a Redis that is down at startup or restarts later
  // needs no handling here. That holds while retryStrategy keeps retrying: one
  // that returns null ends the client, and every later call fails.
  const publisher = redisClient.duplicate({ lazyConnect: true })
  publisher.on('error', (err) =>
    logger.error(`publisher redis error: ${describe(err)}`),
  )
  // No ready check on the subscriber: ioredis writes a psubscribe as soon as
  // the socket is open, and its ready check (INFO) is then refused because the
  // connection is in subscriber mode. That fails the connection attempt, and
  // messages published until ioredis has reconnected are lost.
  const subscriber = publisher.duplicate({ enableReadyCheck: false })
  // One lookup per message, independent of unrelated upload sockets.
  subscriber.on('pmessage', dispatch)
  subscriber.on('error', (err) =>
    logger.error(`subscriber redis error: ${describe(err)}`),
  )

  /**
   * Run Redis commands, failing the call with a logged error when one fails.
   */
  async function runWhenConnected(
    fn: (clients: { subscriber: Redis; publisher: Redis }) => unknown,
  ): Promise<void> {
    try {
      await fn({ subscriber, publisher })
    } catch (err) {
      throw handleError(err)
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
      // A listener may have rejoined while the unsubscribe was queued.
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
    const registration: Registration = { once: _once }
    handlers.set(handler, registration)

    try {
      await runWhenConnected(async ({ subscriber }) => {
        if (handlersByPattern.has(pattern)) await subscriber.psubscribe(pattern)
      })
    } catch (err) {
      // A failed on() must leave no listener behind, or a later on() with the
      // same handler would have it called twice.
      if (handlers.get(handler) === registration) {
        handlers.delete(handler)
        if (handlers.size === 0 && handlersByPattern.get(pattern) === handlers)
          handlersByPattern.delete(pattern)
      }
      throw err
    }
  }

  /**
   * Add an event listener
   *
   * @param eventName name of the event
   * @param handler the handler of the event
   */
  function on(eventName: string, handler: Handler) {
    return handled(addListener(eventName, handler))
  }

  /**
   * Remove an event listener
   *
   * @param eventName name of the event
   * @param handler the handler of the event
   */
  function off(eventName: string, handler: Handler) {
    return handled(removeListener(eventName, handler))
  }

  /**
   * Add an event listener (will be triggered at most once)
   *
   * @param eventName name of the event
   * @param handler the handler of the event
   */
  function once(eventName: string, handler: Handler) {
    return handled(addListener(eventName, handler, true))
  }

  /**
   * Announce the occurrence of an event
   *
   * @param eventName name of the event
   */
  function emit(eventName: string, ...args: unknown[]) {
    return handled(
      runWhenConnected(async ({ publisher }) =>
        publisher.publish(
          getChannelName(eventName),
          safeStringify.default(args, replacer),
        ),
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
    removeListener: (eventName: string, handler: Handler) =>
      handled(removeListener(eventName, handler)),
    removeAllListeners: (eventName: string) =>
      handled(removeAllListeners(eventName)),
  }
}
