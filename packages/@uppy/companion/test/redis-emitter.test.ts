import type { Redis } from 'ioredis'

import { EventEmitter, once } from 'node:events'

import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest'

import redisEmitter, {
  escapeGlob,
} from '../src/server/emitter/redis-emitter.js'
import * as logger from '../src/server/logger.js'

const token = '0b0f4a5c-6c2e-4a76-9d8e-2a1d5e3f7b90'

/**
 * Just enough of an ioredis client for the emitter: duplicate() hands out
 * clients that share one message bus, so publish() reaches psubscribe()rs.
 * The commands are spies shared by all clients, for asserting on what the
 * emitter sends. Redis counts as down for the first `failSubscribes`
 * psubscribe() calls: those fail the way a Redis reply error does, with the
 * command's arguments attached.
 */
function fakeRedis({ failSubscribes = 0 } = {}) {
  let failures = failSubscribes
  // like Redis: subscribing to a pattern twice delivers once
  const subscribers = new Map<string, Set<EventEmitter>>()
  const publishRaw = (channel: string, message: string) => {
    for (const client of subscribers.get(channel) ?? []) {
      client.emit('pmessage', channel, channel, message)
    }
  }
  const commands = {
    psubscribe: vi.fn(function (
      this: EventEmitter,
      pattern: string,
    ): Promise<void> {
      if (failures > 0) {
        failures--
        return Promise.reject(
          Object.assign(new Error('NOPERM psubscribe'), {
            command: { name: 'psubscribe', args: [pattern] },
          }),
        )
      }
      let clients = subscribers.get(pattern)
      if (!clients) {
        clients = new Set()
        subscribers.set(pattern, clients)
      }
      clients.add(this)
      return Promise.resolve()
    }),
    punsubscribe: vi.fn(function (
      this: EventEmitter,
      pattern: string,
    ): Promise<void> {
      subscribers.get(pattern)?.delete(this)
      return Promise.resolve()
    }),
    publish: vi.fn((channel: string, message: string): Promise<number> => {
      publishRaw(channel, message)
      return Promise.resolve(1)
    }),
  }
  const clients: EventEmitter[] = []
  const make = (): EventEmitter => {
    const client = Object.assign(new EventEmitter(), commands, {
      duplicate: () => make(),
    })
    clients.push(client)
    return client
  }
  const client = make()
  return {
    ...commands,
    client: client as unknown as Redis,
    // the emitter's own clients, in the order it creates them
    get publisher() {
      return clients[1]!
    },
    get subscriber() {
      return clients[2]!
    },
    clients,
    publishRaw,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

function expectNoUnhandledRejections() {
  const unhandled = vi.fn()
  process.on('unhandledRejection', unhandled)
  onTestFinished(() => {
    process.off('unhandledRejection', unhandled)
  })
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(unhandled).not.toHaveBeenCalled()
  }
}

test.each([
  ['plain', 'plain'],
  ['a*b', 'a\\*b'],
  ['a?b', 'a\\?b'],
  ['[abc]', '\\[abc\\]'],
  ['a\\b', 'a\\\\b'],
])('escapeGlob(%s)', (input, expected) => {
  expect(escapeGlob(input)).toBe(expected)
})

test('one dispatcher serves unrelated subscriptions and removes once handlers before delivery', async () => {
  const redis = fakeRedis()
  const events = redisEmitter(redis.client)
  const unrelated = vi.fn()
  const once = vi.fn(() =>
    redis.subscriber.emit('pmessage', 'active', 'active', '[]'),
  )
  await events.on('unrelated', unrelated)
  await events.once('active', once)
  redis.subscriber.emit('pmessage', 'active', 'active', '[]')
  expect(once).toHaveBeenCalledTimes(1)
  expect(unrelated).not.toHaveBeenCalled()
  const pmessageListeners = redis.clients.reduce(
    (sum, client) => sum + client.listenerCount('pmessage'),
    0,
  )
  expect(pmessageListeners).toBe(1)
})

test('failed commands reject for callers that wait, without unhandled rejections for those that do not', async () => {
  vi.spyOn(logger, 'error').mockImplementation(() => {})
  const settled = expectNoUnhandledRejections()
  const redis = fakeRedis()
  const events = redisEmitter(redis.client)
  await events.on('active', vi.fn())
  // A login waits on these: a lost publish or subscribe must not look like success
  redis.publish.mockRejectedValueOnce(new Error('Redis unavailable'))
  await expect(events.emit('active')).rejects.toThrow('Redis unavailable')
  redis.psubscribe.mockRejectedValueOnce(new Error('Redis unavailable'))
  await expect(events.on('other', vi.fn())).rejects.toThrow('Redis unavailable')
  // The uploader doesn't wait on its calls
  redis.publish.mockRejectedValueOnce(new Error('Redis unavailable'))
  void events.emit('active')
  redis.psubscribe.mockRejectedValueOnce(new Error('Redis unavailable'))
  void events.on('third', vi.fn())
  await settled()
})

test('malformed payloads are dropped', async () => {
  vi.spyOn(logger, 'warn').mockImplementation(() => {})
  const redis = fakeRedis()
  const events = redisEmitter(redis.client)
  const handler = vi.fn()
  await events.on('active', handler)
  redis.subscriber.emit('pmessage', 'active', 'active', '{')
  redis.subscriber.emit('pmessage', 'active', 'active', '{}')
  expect(handler).not.toHaveBeenCalled()
  redis.subscriber.emit('pmessage', 'active', 'active', '[1]')
  expect(handler).toHaveBeenCalledWith(1)
})

test('a failed connection rejects the call, without an error listener, and the emitter recovers', async () => {
  const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
  const settled = expectNoUnhandledRejections()
  const redis = fakeRedis()
  // ioredis connects on the first command and fails the queued command once it
  // has given up retrying it while the connection is down
  redis.publish.mockRejectedValueOnce(
    Object.assign(new Error('Reached the max retries per request limit'), {
      name: 'MaxRetriesPerRequestError',
    }),
  )
  const events = redisEmitter(redis.client)
  await expect(events.emit('active')).rejects.toThrow('max retries')
  expect(JSON.stringify(error.mock.calls)).toContain(
    'MaxRetriesPerRequestError',
  )
  // no memoized failed connection: the next call goes to Redis again
  await expect(events.emit('active')).resolves.toBeUndefined()
  expect(redis.publish).toHaveBeenCalledTimes(2)
  await settled()
})

test('subscribes with an escaped pattern but publishes to the literal channel', async () => {
  const redis = fakeRedis()
  const em = redisEmitter(redis.client, 'scope')
  await em.on('a*b', () => {})
  expect(redis.psubscribe).toHaveBeenCalledWith('scope:a\\*b')
  await em.emit('a*b', { x: 1 })
  expect(redis.publish).toHaveBeenCalledWith(
    'scope:a*b',
    JSON.stringify([{ x: 1 }]),
  )
})

test('delivers a pmessage whose pattern is the escaped name', async () => {
  const redis = fakeRedis()
  const em = redisEmitter(redis.client, '')
  const handler = vi.fn()
  await em.on('a*b', handler)
  redis.subscriber.emit('pmessage', 'a\\*b', 'a*b', JSON.stringify(['hello']))
  expect(handler).toHaveBeenCalledWith('hello')
})

test('removing the last listener unsubscribes the escaped pattern', async () => {
  const redis = fakeRedis()
  const em = redisEmitter(redis.client, 'scope')
  const h = () => {}
  await em.on('a*b', h)
  await em.removeListener('a*b', h)
  expect(redis.punsubscribe).toHaveBeenCalledWith('scope:a\\*b')
})

describe('redis emitter', () => {
  test('drops a message that is not a JSON array, without an error event', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const { client, publishRaw } = fakeRedis()
    const emitter = redisEmitter(client, 'scope')
    const onError = vi.fn()
    const handler = vi.fn()
    await emitter.on('error', onError)
    await emitter.once(`connection:${token}`, handler)

    for (const message of ['not json', '{"an":"object"}']) {
      publishRaw(`scope:connection:${token}`, message)
    }
    expect(handler).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()

    // the once() subscription survives the invalid messages
    await emitter.emit(`connection:${token}`, 'ready')
    expect(handler).toHaveBeenCalledWith('ready')

    const logged = JSON.stringify(warn.mock.calls)
    expect(logged).toContain(token.slice(0, 8))
    expect(logged).not.toContain(token)
    expect(logged).not.toContain('not json')
  })

  test('an invalid message does not throw when nothing listens for errors', async () => {
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const { client, publishRaw } = fakeRedis()
    const emitter = redisEmitter(client)
    await emitter.on(token, vi.fn())
    expect(() => publishRaw(token, 'not json')).not.toThrow()
  })

  test('a failed subscribe fails on() and reaches error listeners, without its arguments', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const { client } = fakeRedis({ failSubscribes: 1 })
    const emitter = redisEmitter(client)
    const onError = vi.fn()
    await emitter.on('error', onError)
    await expect(emitter.on(token, vi.fn())).rejects.toThrow(
      'NOPERM psubscribe',
    )
    expect(onError).toHaveBeenCalledOnce()
    const passedOn = onError.mock.calls[0]?.[0]
    expect(passedOn).toBeInstanceOf(Error)
    expect(Object.keys(passedOn)).toEqual([])
    expect(passedOn.message).toContain('NOPERM psubscribe')
    expect(passedOn.message).not.toContain(token)
    // The log names the kind of error only: a Redis reply can quote the command.
    const logged = JSON.stringify(error.mock.calls)
    expect(logged).toContain('NOPERM')
    expect(logged).not.toContain('psubscribe')
    expect(logged).not.toContain(token)
  })

  test('an import waiting with events.once() fails when its subscribe fails', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    const { client } = fakeRedis({ failSubscribes: 1 })
    const emitter = redisEmitter(client)
    // as Uploader#awaitReady does
    await expect(
      once(emitter as never, `connection:${token}`, {
        signal: AbortSignal.timeout(1000),
      }),
    ).rejects.toThrow('NOPERM psubscribe')
  })

  test('a failure nobody awaits is not an unhandled rejection', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    const settled = expectNoUnhandledRejections()
    const { client } = fakeRedis({ failSubscribes: 1 })
    const emitter = redisEmitter(client)
    emitter.on(token, vi.fn())
    await settled()
  })

  test('a failed connect is logged with the reason for each address', () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const redis = fakeRedis()
    redisEmitter(redis.client)
    // ioredis reports a failed connect like this
    redis.publisher.emit(
      'error',
      new AggregateError([
        new Error('connect ECONNREFUSED 127.0.0.1:6379'),
        new Error('connect ECONNREFUSED ::1:6379'),
      ]),
    )
    expect(error).toHaveBeenCalledWith(
      'publisher redis error: AggregateError: Error: connect ECONNREFUSED 127.0.0.1:6379; Error: connect ECONNREFUSED ::1:6379',
    )
  })

  test('a failed on() leaves no listener behind', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    const { client } = fakeRedis({ failSubscribes: 1 })
    const emitter = redisEmitter(client)
    const failed = vi.fn()
    await expect(emitter.on(token, failed)).rejects.toThrow()
    const handler = vi.fn()
    await emitter.on(token, handler)
    await emitter.emit(token, 'hello')
    expect(failed).not.toHaveBeenCalled()
    expect(handler).toHaveBeenCalledOnce()
    // the same handler again: delivered once, not twice
    await emitter.on(token, failed)
    await emitter.emit(token, 'again')
    expect(failed).toHaveBeenCalledOnce()
  })

  test('works again once Redis recovers from a failure', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    const { client } = fakeRedis({ failSubscribes: 1 })
    const emitter = redisEmitter(client)
    await expect(emitter.on(token, vi.fn())).rejects.toThrow()
    const handler = vi.fn()
    await emitter.on(token, handler)
    await emitter.emit(token, 'hello')
    expect(handler).toHaveBeenCalledWith('hello')
  })
})
