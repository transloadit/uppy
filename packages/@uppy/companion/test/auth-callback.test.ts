import { EventEmitter, once } from 'node:events'
import { createServer, type Server } from 'node:http'
import express from 'express'
import session from 'express-session'
import { Pipeline, Redis } from 'ioredis'
import request from 'supertest'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { WebSocket } from 'ws'
import { defaultOptions } from '../dist/config/companion.js'
import {
  publishAuthCallback,
  takeAuthCallback,
} from '../dist/server/auth-callback.js'
import sendToken from '../dist/server/controllers/send-token.js'
import type { EmitterLike } from '../dist/server/emitter/index.js'
import redisEmitter from '../dist/server/emitter/redis-emitter.js'
import { generateEncryptedAuthToken } from '../dist/server/helpers/jwt.js'
import { encodeState } from '../dist/server/helpers/oauth-state.js'
import setupSockets from '../dist/server/socket.js'

// Flows are sequential: establish or hold the subscription before switching
// this mocked process singleton to the independent publishing worker.
let bus: EmitterLike
let storage: Redis | undefined
vi.mock('../dist/server/emitter/index.js', () => ({ default: () => bus }))
vi.mock('../dist/server/redis.js', () => ({ client: () => storage }))
vi.mock('express-prom-bundle')

const clients: Redis[] = []
const sockets: WebSocket[] = []
const servers: Server[] = []
const removals: Promise<unknown>[] = []
const options = {
  ...defaultOptions,
  secret: 'secret',
  filePath: './test/output',
  server: { ...defaultOptions.server, host: 'localhost:3020' },
  redisPubSubScope: 'auth-callback-test',
}
const token = generateEncryptedAuthToken(
  { dropbox: { accessToken: 'fixture-token' } },
  'secret',
)

afterEach(async () => {
  vi.useRealTimers()
  for (const item of [...sockets.splice(0), ...servers.splice(0)]) {
    if ('readyState' in item && item.readyState === WebSocket.CLOSED) continue
    const closed = once(item, 'close')
    item.close()
    await closed
  }
  await Promise.all(removals.splice(0))
  for (const client of clients.splice(0)) client.disconnect()
  storage = undefined
  vi.restoreAllMocks()
})

describe.each(['memory', 'redis'] as const)('%s auth callback', (mode) => {
  const run =
    mode === 'redis' && !process.env['COMPANION_REDIS_URL'] ? test.skip : test

  async function start() {
    let publisher: EmitterLike
    let subscriber: EmitterLike
    if (mode === 'redis') {
      storage = new Redis(process.env['COMPANION_REDIS_URL']!)
      clients.push(storage)
      const duplicate = Redis.prototype.duplicate
      vi.spyOn(Redis.prototype, 'duplicate').mockImplementation(function (
        this: Redis,
        ...args
      ) {
        const client = duplicate.apply(this, args)
        clients.push(client)
        return client
      })
      publisher = redisEmitter(storage, options.redisPubSubScope)
      subscriber = redisEmitter(storage, options.redisPubSubScope)
      // Initialize both independent Redis emitters before exercising callback
      // subscription ordering. This does not subscribe to the callback channel.
      for (const events of [publisher, subscriber]) {
        const noop = () => {}
        await events.on('test-ready', noop)
        await events.removeListener('test-ready', noop)
      }
    } else {
      publisher = new EventEmitter()
      subscriber = publisher
    }
    bus = subscriber
    const remove = subscriber.removeListener.bind(subscriber)
    vi.spyOn(subscriber, 'removeListener').mockImplementation((...args) => {
      const result = Promise.resolve(remove(...args))
      removals.push(result)
      return result
    })
    const callbackToken = crypto.randomUUID()
    const state = encodeState(
      {
        id: callbackToken,
        origin: 'http://localhost:3020',
        authCallbackToken: callbackToken,
      },
      'secret',
    )
    const app = express()
    app.use(
      session({ secret: 'fixture', resave: false, saveUninitialized: false }),
    )
    app.get('/send-token', (req, res, next) => {
      req.companion = {
        options,
        authToken: token,
        s3ProviderClients: new Map(),
      }
      req.session.grant = { dynamic: { state } }
      return sendToken(req, res, next)
    })
    const server = createServer(app)
    servers.push(server)
    setupSockets(server, options)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing port')
    return {
      callbackToken,
      publisher,
      subscriber,
      async callback() {
        bus = publisher
        await request(app).get('/send-token').expect(200)
      },
      connect(signal = AbortSignal.timeout(2000)) {
        bus = subscriber
        const socket = new WebSocket(
          `ws://127.0.0.1:${address.port}/api2/auth-callback/token/${callbackToken}`,
        )
        sockets.push(socket)
        return once(socket, 'message', { signal }).then(([message]) =>
          JSON.parse(message.toString()),
        )
      },
    }
  }

  async function connectSubscribed(flow: Awaited<ReturnType<typeof start>>) {
    const ready = Promise.withResolvers<void>()
    const on = flow.subscriber.on.bind(flow.subscriber)
    vi.spyOn(flow.subscriber, 'on').mockImplementation(async (...args) => {
      await on(...args)
      ready.resolve()
    })
    const result = flow.connect()
    await ready.promise
    return { result }
  }

  run('delivers a callback completed before the socket connects', async () => {
    const flow = await start()
    await flow.callback()
    expect(await flow.connect()).toEqual({ token })
  })

  run('preserves delivery to an already subscribed socket', async () => {
    const flow = await start()
    const { result } = await connectSubscribed(flow)
    await flow.callback()
    expect(await result).toEqual({ token })
  })

  run('accepts the unchanged payload from an older publisher', async () => {
    const flow = await start()
    const { result } = await connectSubscribed(flow)
    await flow.publisher.emit(flow.callbackToken, { token })
    expect(await result).toEqual({ token })
  })

  run('redacts callback tokens from delivery errors', async () => {
    const flow = await start()
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const failure = Object.assign(new Error('Redis unavailable'), {
      command: { args: [flow.callbackToken, token] },
    })
    vi.spyOn(flow.subscriber, 'on').mockRejectedValueOnce(failure)
    const controller = new AbortController()
    const result = flow.connect(controller.signal)
    void result.catch(() => {})
    await once(sockets.at(-1)!, 'close')
    controller.abort()
    const output = log.mock.calls.flat().join(' ')
    expect(output).toContain('socket.auth.redis.error')
    expect(output).not.toContain(flow.callbackToken)
    bus = flow.publisher
    vi.spyOn(flow.publisher, 'emit').mockRejectedValueOnce(failure)
    const promise = publishAuthCallback(flow.callbackToken, { token }, options)
    const published = await promise.catch((error: unknown) => error)
    expect(published).toBeInstanceOf(Error)
    expect(JSON.stringify(published)).not.toContain(token)
    expect(JSON.stringify(published)).not.toContain(flow.callbackToken)
  })

  if (mode === 'redis')
    run.each([true, false])('live with SET failure %s', async (setFails) => {
      const flow = await start()
      const log = vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.spyOn(Pipeline.prototype, 'exec').mockRejectedValue(new Error())
      const { result } = await connectSubscribed(flow)
      void result.catch(() => {})
      if (setFails)
        vi.spyOn(storage!, 'set').mockRejectedValueOnce(
          Object.assign(new Error('Retained writes unavailable'), {
            command: {
              name: 'set',
              args: ['callback-key', JSON.stringify({ token })],
            },
          }),
        )
      await flow.callback()
      expect(await result).toEqual({ token })
      const output = log.mock.calls.flat().join(' ')
      expect(output).toContain('socket.auth.redis.error')
      if (setFails) expect(output).toContain('auth.callback.retain.error')
      expect(output).not.toContain(token)
    })

  run(
    'keeps the result when a socket closes before subscription completes',
    async () => {
      const flow = await start()
      await flow.callback()
      const subscribing = Promise.withResolvers<void>()
      const proceed = Promise.withResolvers<void>()
      const cleaned = Promise.withResolvers<void>()
      const on = flow.subscriber.on.bind(flow.subscriber)
      vi.spyOn(flow.subscriber, 'on').mockImplementation(async (...args) => {
        subscribing.resolve()
        await proceed.promise
        return on(...args)
      })
      const remove = vi
        .mocked(flow.subscriber.removeListener)
        .getMockImplementation()!
      let removals = 0
      vi.spyOn(flow.subscriber, 'removeListener').mockImplementation(
        async (...args) => {
          await remove(...args)
          if (++removals === 2) cleaned.resolve()
        },
      )
      const controller = new AbortController()
      const aborted = expect(
        flow.connect(controller.signal),
      ).rejects.toMatchObject({ name: 'AbortError' })
      await subscribing.promise
      const socket = sockets.at(-1)!
      if (socket.readyState === WebSocket.CONNECTING) await once(socket, 'open')
      const closed = once(socket, 'close')
      socket.close()
      await closed
      proceed.resolve()
      await cleaned.promise
      controller.abort()
      await aborted
      expect(await takeAuthCallback(flow.callbackToken, options)).toEqual({
        token,
      })
    },
  )

  run('allows only one consumer to take a retained result', async () => {
    const flow = await start()
    await flow.callback()
    const results = await Promise.all([
      takeAuthCallback(flow.callbackToken, options),
      takeAuthCallback(flow.callbackToken, options),
    ])
    expect(results.filter((result) => result !== undefined)).toEqual([
      { token },
    ])
  })

  run('expires an unconsumed result after one minute', async () => {
    const flow = await start()
    if (storage) {
      await flow.callback()
      const [key] = await storage.keys(`*:${flow.callbackToken}`)
      expect(key).toBeDefined()
      expect(await storage.ttl(key!)).toBeGreaterThan(0)
      expect(await storage.ttl(key!)).toBeLessThanOrEqual(60)
      await storage.pexpire(key!, 0)
    } else {
      vi.useFakeTimers()
      const otherToken = crypto.randomUUID()
      await publishAuthCallback(otherToken, { token }, options)
      await publishAuthCallback(flow.callbackToken, { token }, options)
      await vi.advanceTimersByTimeAsync(59_999)
      expect(await takeAuthCallback(otherToken, options)).toEqual({ token })
      await vi.advanceTimersByTimeAsync(1)
    }
    expect(await takeAuthCallback(flow.callbackToken, options)).toBeUndefined()
  })

  run(
    'delivers a callback completed while subscription is pending',
    async () => {
      const flow = await start()
      const subscribing = Promise.withResolvers<void>()
      const proceed = Promise.withResolvers<void>()
      const on = flow.subscriber.on.bind(flow.subscriber)
      vi.spyOn(flow.subscriber, 'on').mockImplementation(async (...args) => {
        subscribing.resolve()
        await proceed.promise
        return on(...args)
      })
      const result = flow.connect()
      await subscribing.promise
      const socket = sockets.at(-1)!
      if (socket.readyState === WebSocket.CONNECTING) await once(socket, 'open')
      await flow.callback()
      proceed.resolve()
      expect(await result).toEqual({ token })
    },
  )
})
