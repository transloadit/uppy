import type { Redis } from 'ioredis'
import nodeEmitter from './default-emitter.ts'
import redisEmitter from './redis-emitter.ts'

type Listener = (...args: unknown[]) => void
export type EmitterLike = {
  on: (eventName: string, handler: Listener) => unknown
  once: (eventName: string, handler: Listener) => unknown
  off?: (eventName: string, handler: Listener) => unknown
  emit: (eventName: string, ...args: unknown[]) => unknown
  removeListener: (eventName: string, handler: Listener) => unknown
  removeAllListeners: (eventName: string) => unknown
}

let emitter: EmitterLike | undefined

/**
 * Singleton event emitter that is shared between modules throughout the lifetime of the server.
 * Used to transmit events (such as progress, upload completion) from controllers,
 * such as the Google Drive 'get' controller, along to the client.
 */
export default function getEmitter(
  redisClient?: unknown,
  redisPubSubScope?: string,
): EmitterLike {
  if (!emitter) {
    const isRedisClient = (value: unknown): value is Redis => {
      if (!value || (typeof value !== 'object' && typeof value !== 'function'))
        return false
      return typeof Reflect.get(value, 'duplicate') === 'function'
    }

    emitter =
      redisClient && isRedisClient(redisClient)
        ? redisEmitter(redisClient, redisPubSubScope)
        : nodeEmitter()
  }

  return emitter
}
