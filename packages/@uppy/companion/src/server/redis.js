const redis = require('redis')

const logger = require('./logger')

let redisClient

/**
 * A Singleton module that provides a single redis client through out
 * the lifetime of the server
 *
 * @param {Record<string, unknown>} [opts] node-redis client options
 */
function createClient (opts) {
  if (!redisClient) {
    // todo remove legacyMode when fixed: https://github.com/tj/connect-redis/issues/361
    redisClient = redis.createClient({ ...opts, legacyMode: true })

    redisClient.on('error', err => logger.error('redis error', err))

    ;(async () => {
      try {
        // fire and forget.
        // any requests made on the client before connection is established will be auto-queued by node-redis
        await redisClient.connect()
      } catch (err) {
        logger.error(err.message, 'redis.error')
      }
    })()
  }

  return redisClient
}

module.exports.client = (companionOptions) => {
  if (!companionOptions) {
    return redisClient
  }

  return createClient({ ...companionOptions.redisOptions, url: companionOptions.redisUrl })
}
