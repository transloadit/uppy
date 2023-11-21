const redis = require('redis')

const logger = require('./logger')

let redisClient

/**
 * A Singleton module that provides a single redis client through out
 * the lifetime of the server
 *
 * @param {{ redisUrl?: string, redisOptions?: Record<string, any> }} [companionOptions] options
 */
function createClient (companionOptions) {
  if (!redisClient) {
    const { redisUrl, redisOptions } = companionOptions
    redisClient = redis.createClient({
      ...redisOptions,
      ...(redisUrl && { url: redisUrl }),
    })

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
  if (!companionOptions?.redisUrl && !companionOptions?.redisOptions) {
    return redisClient
  }

  return createClient(companionOptions)
}
