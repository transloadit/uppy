const redis = require('redis')
const merge = require('lodash.merge')

let redisClient

/**
 * A Singleton module that provides a single redis client through out
 * the lifetime of the server
 *
 * @param {object=} opts node-redis client options
 */
function createClient (opts) {
  if (!redisClient) {
    redisClient = redis.createClient(opts)
  }

  return redisClient
}

module.exports.client = (companionOptions) => {
  if (!companionOptions) {
    return redisClient
  }

  return createClient(merge({ url: companionOptions.redisUrl }, companionOptions.redisOptions))
}
