import type { Redis } from 'ioredis'

import type { CompanionInitOptions } from '../schemas/companion.js'

import { once } from 'node:events'

import emitter from './emitter/index.js'
import { jsonStringify } from './helpers/utils.js'
import * as logger from './logger.js'
import * as redis from './redis.js'

const expirySeconds = 60
const commandTimeoutMs = 5000
const pending = new Map<string, { data: object; timer: NodeJS.Timeout }>()

// One wait per client: every login waiting on its own `once()` would add a
// listener pair to the shared client and trip its max-listeners warning when
// logins pile up during an outage.
const readiness = new WeakMap<Redis, Promise<unknown>>()

function whenReady(client: Redis): Promise<unknown> {
  if (client.status === 'ready') return Promise.resolve()
  // An ended client never becomes ready again.
  if (client.status === 'end')
    return Promise.reject(new Error('OAuth Redis client ended'))
  let wait = readiness.get(client)
  if (!wait) {
    // `bounded()` times out the caller; this wait stays shared until ready.
    wait = once(client, 'ready').finally(() => readiness.delete(client))
    readiness.set(client, wait)
  }
  return wait
}

/**
 * Run a token-bearing command on the shared client, bounded in time. Waiting
 * for readiness first keeps the command out of the offline queue, so a login
 * fails fast during an outage instead of holding the callback request open.
 */
async function bounded<T>(client: Redis, run: () => Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  let expired = false
  const timedOut = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      expired = true
      reject(new Error('OAuth Redis command timed out'))
    }, commandTimeoutMs)
    timer.unref()
  })
  // A command whose wait for readiness timed out must not run later.
  const runWhenReady = async () => {
    await whenReady(client)
    if (expired) throw new Error('OAuth Redis command timed out')
    return run()
  }
  try {
    return await Promise.race([runWhenReady(), timedOut])
  } finally {
    clearTimeout(timer)
  }
}

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
  // Do not leave a result behind a failure page. Best effort: Redis may be gone.
  const discard = () => {
    if (storage) {
      // A timed-out SET can still land, also after a reconnect, so delete once
      // Redis is ready, without holding up the failure page.
      void bounded(storage, () => storage.del(key)).catch(() => {})
    } else {
      clearTimeout(pending.get(key)?.timer)
      pending.delete(key)
    }
  }
  try {
    if (storage) {
      await bounded(storage, () =>
        storage.set(key, jsonStringify(data), 'EX', expirySeconds),
      )
    } else {
      clearTimeout(pending.get(key)?.timer)
      const timer = setTimeout(() => pending.delete(key), expirySeconds * 1000)
      timer.unref()
      pending.set(key, { data, timer })
    }
  } catch {
    // A SET that timed out here can still land later.
    discard()
    // Redis errors include SET arguments, so never log the error or token.
    logger.error('OAuth retention failed', 'auth.callback.retain.error')
    throw new Error('OAuth callback retention failed')
  }

  // Keep the first argument compatible with older socket workers. The second
  // marks retained results so new workers consume storage instead of replaying
  // the publication after another socket already consumed it.
  try {
    // The emitter rejects a failed publish only while nothing listens for its
    // 'error' event; with a listener, the failure would go unnoticed here.
    const publish = async () => emitter().emit(token, data, true)
    await (storage ? bounded(storage, publish) : publish())
  } catch {
    discard()
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
  return result.data
}
