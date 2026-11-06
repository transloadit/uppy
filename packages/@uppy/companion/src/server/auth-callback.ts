import { once } from 'node:events'
import type { Redis } from 'ioredis'
import type { CompanionInitOptions } from '../schemas/companion.js'
import emitter from './emitter/index.js'
import { jsonStringify } from './helpers/utils.js'
import * as logger from './logger.js'
import * as redis from './redis.js'

const expirySeconds = 60
const maxPending = 1000
const maxPayloadBytes = 64 * 1024
const pending = new Map<
  string,
  { data: string; timer: NodeJS.Timeout; expiresAt: number }
>()
let authRedis: Redis | undefined

async function storageClient(): Promise<Redis | undefined> {
  // A new login may recover an ended connection, without retrying old commands.
  if (!authRedis || authRedis.status === 'end') {
    const shared = redis.client()
    if (!shared) return undefined
    // Keep upload/session retries unchanged. Token-bearing commands must neither
    // wait offline nor be resent after an ambiguous response.
    authRedis = shared.duplicate({
      lazyConnect: false,
      commandTimeout: 5000,
      connectTimeout: 5000,
      socketTimeout: 5000,
      enableOfflineQueue: false,
      enableAutoPipelining: false,
      maxRetriesPerRequest: 0,
      autoResendUnfulfilledCommands: false,
      reconnectOnError: null,
    })
    // Concurrent readiness waits clean themselves up on ready/error or timeout.
    authRedis.setMaxListeners(0)
    authRedis.on('error', () =>
      logger.error('OAuth Redis unavailable', 'auth.callback.redis.error'),
    )
  }
  if (authRedis.status !== 'ready') {
    await once(authRedis, 'ready', { signal: AbortSignal.timeout(5000) })
  }
  return authRedis
}

function storageKey(token: string, options: CompanionInitOptions) {
  const prefix = options.redisPubSubScope ? `${options.redisPubSubScope}:` : ''
  // Preserve #6751's key so mixed-version workers consume the same result.
  return `${prefix}companion:auth-callback:${token}`
}

export async function publishAuthCallback(
  token: string,
  data: object,
  options: CompanionInitOptions,
): Promise<void> {
  const key = storageKey(token, options)
  let storage: Redis | undefined
  const serialized = jsonStringify(data)
  const expiresAt = Date.now() + expirySeconds * 1000
  try {
    if (Buffer.byteLength(serialized) > maxPayloadBytes)
      throw new Error('OAuth result too large')
    storage = await storageClient()
    if (storage) {
      // An absolute deadline prevents a delayed write from extending retention.
      // MULTI + PEXPIREAT also supports Redis versions without SET PXAT.
      const results = await storage
        .multi()
        .set(key, serialized)
        .pexpireat(key, expiresAt)
        .exec()
      if (!results || results.some(([error]) => error))
        throw new Error('OAuth retention transaction failed')
    } else {
      clearTimeout(pending.get(key)?.timer)
      pending.delete(key)
      if (pending.size >= maxPending) {
        const oldest = pending.keys().next().value
        if (oldest !== undefined) {
          clearTimeout(pending.get(oldest)?.timer)
          pending.delete(oldest)
        }
      }
      const timer = setTimeout(() => pending.delete(key), expirySeconds * 1000)
      timer.unref()
      pending.set(key, { data: serialized, timer, expiresAt })
    }
  } catch {
    // A failed write may still have reached Redis. Publishing an unconfirmed result
    // for direct delivery could let another socket consume the retained copy again.
    // Redis errors include SET arguments, so never log the error or token.
    logger.error('OAuth retention failed', 'auth.callback.retain.error')
    throw new Error('OAuth callback retention failed')
  }

  // Keep the first argument compatible with older socket workers. The second
  // marks retained results so new workers consume storage instead of replaying
  // the publication after another socket already consumed it.
  try {
    if (storage) {
      const prefix = options.redisPubSubScope
        ? `${options.redisPubSubScope}:`
        : ''
      // Preserve the emitter wire format without its shared publisher's offline queue.
      await storage.publish(`${prefix}${token}`, jsonStringify([data, true]))
    } else {
      await emitter().emit(token, data, true)
    }
  } catch {
    // Keep command arguments out of the request error handler and response.
    logger.error('OAuth publication failed', 'auth.callback.publish.error')
    throw new Error('OAuth callback publication failed')
  }
}

export async function takeAuthCallback(
  token: string,
  options: CompanionInitOptions,
): Promise<unknown> {
  const key = storageKey(token, options)
  const storage = await storageClient()
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
  return result.expiresAt > Date.now() ? JSON.parse(result.data) : undefined
}
