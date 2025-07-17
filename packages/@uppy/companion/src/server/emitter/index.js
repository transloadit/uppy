import nodeEmitter from './default-emitter.js'
import redisEmitter from './redis-emitter.js'

let emitter

/**
 * Singleton event emitter that is shared between modules throughout the lifetime of the server.
 * Used to transmit events (such as progress, upload completion) from controllers,
 * such as the Google Drive 'get' controller, along to the client.
 */
export default function getEmitter(redisClient, redisPubSubScope) {
  if (!emitter) {
    emitter = redisClient
      ? redisEmitter(redisClient, redisPubSubScope)
      : nodeEmitter()
  }

  return emitter
}
