const redis = require('redis')
const merge = require('lodash.merge')

let redisClient

/**
 * A Singleton module that provides a single redis client through out
 * the lifetime of the server
 *
 * @param {Record<string, unknown>} [opts] node-redis client options
 */
function createClient (opts) {
  if (!redisClient) {
    // TODO: rewrite to non-legacy mode once connect-redis supports it
    redisClient = redis.createClient({ ...opts, legacyMode: true })
  }

  return redisClient
}

module.exports.client = (companionOptions) => {
  if (!companionOptions) {
    return redisClient
  }

  return createClient(merge({ url: companionOptions.redisUrl }, companionOptions.redisOptions))
}
