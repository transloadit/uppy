import type { CompanionInitOptions } from '../schemas/companion.js'
import emitter from './emitter/index.js'
import { jsonStringify } from './helpers/utils.js'
import * as logger from './logger.js'
import * as redis from './redis.js'

const expirySeconds = 60
const pending = new Map<string, { data: object; timer: NodeJS.Timeout }>()

function storageKey(token: string, options: CompanionInitOptions) {
  const prefix = options.redisPubSubScope ? `${options.redisPubSubScope}:` : ''
  return `${prefix}companion:auth-callback:${token}`
}

export async function publishAuthCallback(
  token: string,
  data: object,
  options: CompanionInitOptions,
): Promise<void> {
  const key = storageKey(token, options)
  const storage = redis.client()
  let retained = false
  // Bound waits with redisOptions.commandTimeout and enableOfflineQueue: false.
  // Local timeouts can let a late SET recreate an already consumed result.
  try {
    if (storage) {
      await storage.set(key, jsonStringify(data), 'EX', expirySeconds)
    } else {
      clearTimeout(pending.get(key)?.timer)
      const timer = setTimeout(() => pending.delete(key), expirySeconds * 1000)
      timer.unref()
      pending.set(key, { data, timer })
    }
    retained = true
  } catch {
    // Pub/sub may still work when Redis rejects writes (for example, on OOM).
    // Redis errors include SET arguments, so never log the error or token.
    logger.error('OAuth retention failed', 'auth.callback.retain.error')
  }

  // Keep the first argument compatible with older socket workers. The second
  // marks retained results so new workers consume storage instead of replaying
  // the publication after another socket already consumed it.
  try {
    await emitter().emit(token, data, retained)
  } catch {
    // Keep command arguments out of the request error handler and response.
    throw new Error('OAuth callback publication failed')
  }
}

export async function takeAuthCallback(
  token: string,
  options: CompanionInitOptions,
): Promise<unknown> {
  const key = storageKey(token, options)
  const storage = redis.client()
  if (storage) {
    // MULTI makes reading and deleting atomic, including on Redis before GETDEL.
    const results = await storage.multi().get(key).del(key).exec()
    const [error, data] = results?.[0] ?? []
    if (error) throw error
    return typeof data === 'string' ? JSON.parse(data) : undefined
  }

  const result = pending.get(key)
  if (!result) return undefined
  pending.delete(key)
  clearTimeout(result.timer)
  return result.data
}
