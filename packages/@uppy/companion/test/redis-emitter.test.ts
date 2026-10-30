import { EventEmitter, once } from 'node:events'
import { afterEach, describe, expect, test, vi } from 'vitest'
import redisEmitter from '../src/server/emitter/redis-emitter.js'
import * as logger from '../src/server/logger.js'

const token = '0b0f4a5c-6c2e-4a76-9d8e-2a1d5e3f7b90'

/**
 * Just enough of an ioredis client for the emitter: duplicate() hands out
 * clients that share one message bus, so publish() reaches psubscribe()rs.
 * Redis counts as down for the first `failSubscribes` psubscribe() calls:
 * those fail the way a Redis reply error does, with the command's arguments
 * attached, and so does connect() while it is down.
 */
function fakeRedis({ failSubscribes = 0 } = {}) {
  const bus = new EventEmitter()
  let failures = failSubscribes
  const clients: EventEmitter[] = []
  const make = () => {
    const patterns = new Set<string>()
    const client = Object.assign(new EventEmitter(), {
      duplicate: () => make(),
      connect: async () => {
        if (failures > 0) throw new Error('connect ECONNREFUSED')
      },
      psubscribe: async (pattern: string) => {
        if (failures > 0) {
          failures--
          throw Object.assign(new Error('NOPERM psubscribe'), {
            command: { name: 'psubscribe', args: [pattern] },
          })
        }
        // like Redis: subscribing to a pattern twice delivers once
        if (patterns.has(pattern)) return
        patterns.add(pattern)
        bus.on('message', (channel: string, message: string) => {
          if (channel === pattern)
            client.emit('pmessage', pattern, channel, message)
        })
      },
      punsubscribe: async () => {},
      publish: async (channel: string, message: string) => {
        bus.emit('message', channel, message)
      },
    })
    clients.push(client)
    return client
  }
  return {
    client: make(),
    clients,
    publishRaw: (channel: string, message: string) =>
      bus.emit('message', channel, message),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('redis emitter', () => {
  test('drops a message that is not a JSON array, without an error event', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const { client, publishRaw } = fakeRedis()
    const emitter = redisEmitter(client as never, 'scope')
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
    const emitter = redisEmitter(client as never)
    await emitter.on(token, vi.fn())
    expect(() => publishRaw(token, 'not json')).not.toThrow()
  })

  test('a failed subscribe fails on() and reaches error listeners, without its arguments', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const { client } = fakeRedis({ failSubscribes: 1 })
    const emitter = redisEmitter(client as never)
    const onError = vi.fn()
    await emitter.on('error', onError)
    await expect(emitter.on(token, vi.fn())).rejects.toThrow(
      'NOPERM psubscribe',
    )
    expect(onError).toHaveBeenCalledOnce()
    const passedOn = onError.mock.calls[0]?.[0]
    expect(passedOn).toBeInstanceOf(Error)
    expect(Object.keys(passedOn)).toEqual([])
    expect(JSON.stringify(error.mock.calls)).toContain('NOPERM psubscribe')
    expect(JSON.stringify(error.mock.calls)).not.toContain(token)
  })

  test('an import waiting with events.once() fails when its subscribe fails', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    const { client } = fakeRedis({ failSubscribes: 1 })
    const emitter = redisEmitter(client as never)
    // as Uploader#awaitReady does
    await expect(
      once(emitter as never, `connection:${token}`, {
        signal: AbortSignal.timeout(1000),
      }),
    ).rejects.toThrow('NOPERM psubscribe')
  })

  test('a failure nobody awaits is not an unhandled rejection', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    try {
      const { client } = fakeRedis({ failSubscribes: 1 })
      const emitter = redisEmitter(client as never)
      emitter.on(token, vi.fn())
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(unhandled).not.toHaveBeenCalled()
    } finally {
      process.off('unhandledRejection', unhandled)
    }
  })

  test('a failed connect is logged with the reason for each address', () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const { client, clients } = fakeRedis()
    redisEmitter(client as never)
    // the emitter's own clients; ioredis reports a failed connect like this
    clients[1]?.emit(
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
    const emitter = redisEmitter(client as never)
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
    const emitter = redisEmitter(client as never)
    await expect(emitter.on(token, vi.fn())).rejects.toThrow()
    const handler = vi.fn()
    await emitter.on(token, handler)
    await emitter.emit(token, 'hello')
    expect(handler).toHaveBeenCalledWith('hello')
  })
})
