const redis = require('redis')
let redisClient

/**
 * A Singleton module that provides only on redis client through out
 * the lifetime of the server
 *
 * @param {object=} opts node-redis client options
 */
module.exports.client = (opts) => {
  if (!opts) {
    return redisClient
  }

  if (!redisClient) {
    redisClient = redis.createClient(opts)
  }

  return redisClient
}
