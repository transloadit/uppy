const Redis = require('ioredis').default

const logger = require('./logger')

let redisClient

/**
 * A Singleton module that provides a single redis client through out
 * the lifetime of the server
 *
 * @param {string} [redisUrl] ioredis url
 * @param {Record<string, any>} [redisOptions] ioredis client options
 */
function createClient (redisUrl, redisOptions) {
  if (!redisClient) {
    if (redisUrl) {
      redisClient = new Redis(redisUrl, redisOptions)
    } else {
      redisClient = new Redis(redisOptions)
    }
    redisClient.on('error', err => logger.error('redis error', err.toString()))
  }

  return redisClient
}

module.exports.client = ({ redisUrl, redisOptions } = { redisUrl: undefined, redisOptions: undefined }) => {
  if (!redisUrl && !redisOptions) {
    return redisClient
  }

  return createClient(redisUrl, redisOptions)
}
