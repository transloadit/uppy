import type { RedisOptions } from 'ioredis'
import { Redis } from 'ioredis'
import * as logger from './logger.ts'

let redisClient: Redis | undefined

/**
 * A singleton module that provides a single Redis client throughout the
 * lifetime of the server.
 */
function createClient(
  redisUrl: string | undefined,
  redisOptions: RedisOptions | undefined,
): Redis {
  if (redisClient) return redisClient

  redisClient = redisUrl
    ? new Redis(redisUrl, redisOptions)
    : new Redis(redisOptions)
  redisClient.on('error', (err) => logger.error('redis error', err.toString()))

  return redisClient
}

export function client(
  options: { redisUrl?: string; redisOptions?: RedisOptions } = {},
): Redis | undefined {
  const { redisUrl, redisOptions } = options
  if (!redisUrl && !redisOptions) return redisClient
  return createClient(redisUrl, redisOptions)
}
