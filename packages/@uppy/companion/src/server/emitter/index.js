const nodeEmitter = require('./default-emitter')
const redisEmitter = require('./redis-emitter')
let emitter

/**
 * Singleton event emitter that is shared between modules throughout the lifetime of the server.
 * Used to transmit events (such as progress, upload completion) from controllers,
 * such as the Google Drive 'get' controller, along to the client.
 */
module.exports = (redisUrl) => {
  if (!emitter) {
    emitter = redisUrl ? redisEmitter(redisUrl) : nodeEmitter()
  }

  return emitter
}
