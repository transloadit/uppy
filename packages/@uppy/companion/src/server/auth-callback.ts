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
const commandTimeoutMs = 5000
const pending = new Map<
  string,
  { data: string; timer: NodeJS.Timeout; expiresAt: number }
>()

/**
 * Run a token-bearing command on the shared client, bounded in time. Waiting
 * for readiness first keeps the command out of the offline queue, so a login
 * fails fast during an outage instead of holding the callback request open.
 */
async function bounded<T>(client: Redis, run: () => Promise<T>): Promise<T> {
  const signal = AbortSignal.timeout(commandTimeoutMs)
  if (client.status !== 'ready') await once(client, 'ready', { signal })
  const timedOut = once(signal, 'abort').then(() => {
    throw new Error('OAuth Redis command timed out')
  })
  void timedOut.catch(() => {})
  return Promise.race([run(), timedOut])
}

function scopePrefix(options: CompanionInitOptions) {
  return options.redisPubSubScope ? `${options.redisPubSubScope}:` : ''
}

function storageKey(token: string, options: CompanionInitOptions) {
  // Preserve #6751's key so mixed-version workers consume the same result.
  return `${scopePrefix(options)}companion:auth-callback:${token}`
}

export async function publishAuthCallback(
  token: string,
  data: object,
  options: CompanionInitOptions,
): Promise<void> {
  const key = storageKey(token, options)
  const storage = redis.client()
  const serialized = jsonStringify(data)
  try {
    if (Buffer.byteLength(serialized) > maxPayloadBytes)
      throw new Error('OAuth result too large')
    if (storage) {
      // A relative TTL is applied by Redis, so Companion's clock cannot skew it.
      await bounded(storage, () =>
        storage.set(key, serialized, 'PX', expirySeconds * 1000),
      )
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
      const expiresAt = Date.now() + expirySeconds * 1000
      pending.set(key, { data: serialized, timer, expiresAt })
    }
  } catch {
    // Redis errors include SET arguments, so never log the error or token.
    logger.error('OAuth retention failed', 'auth.callback.retain.error')
    throw new Error('OAuth callback retention failed')
  }

  // Keep the first argument compatible with older socket workers. The second
  // marks retained results so new workers consume storage instead of replaying
  // the publication after another socket already consumed it.
  try {
    if (storage) {
      // Same wire format as the emitter, whose emit() swallows Redis errors.
      await bounded(storage, () =>
        storage.publish(
          `${scopePrefix(options)}${token}`,
          jsonStringify([data, true]),
        ),
      )
    } else {
      await emitter().emit(token, data, true)
    }
  } catch {
    // Do not leave a result behind a failure page. Best effort: Redis may be gone.
    if (storage) await bounded(storage, () => storage.del(key)).catch(() => {})
    else pending.delete(key)
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
  const storage = redis.client()
  if (storage) {
    // MULTI makes reading and deleting atomic, including on Redis before GETDEL.
    const results = await bounded(storage, () =>
      storage.multi().get(key).del(key).exec(),
    )
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
