import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { execa } from 'execa'
import { Redis } from 'ioredis'
import { afterEach, describe, expect, test } from 'vitest'
import { WebSocket } from 'ws'
import { z } from 'zod'

const workers: ReturnType<typeof start>[] = []
const sockets: WebSocket[] = []
const clients: Redis[] = []
const aclUsers: { client: Redis; name: string }[] = []
const scope = `callback-test-${randomUUID()}`
const redisUrl = process.env['COMPANION_REDIS_URL']

function start() {
  const child = execa(
    process.execPath,
    [join(import.meta.dirname, 'fixtures/auth-worker.ts')],
    { ipc: true, reject: false, timeout: 25_000 },
  )
  return child
}

async function worker(url?: string) {
  const child = start()
  workers.push(child)
  await child.sendMessage({ redisUrl: url, scope })
  const { origin } = z
    .object({ origin: z.string() })
    .parse(await child.getOneMessage())
  return {
    child,
    origin,
    async command(
      operation: 'publish' | 'hold' | 'release' | 'barrier',
      token: string,
    ) {
      await child.sendMessage({ operation, token })
      return child.getOneMessage()
    },
  }
}

function connect(origin: string, token: string) {
  const socket = new WebSocket(
    `${origin.replace('http:', 'ws:')}/api2/auth-callback/token/${token}`,
  )
  sockets.push(socket)
  const messages: unknown[] = []
  socket.on('message', (data) => messages.push(JSON.parse(data.toString())))
  const message = once(socket, 'message', { signal: AbortSignal.timeout(2500) })
  void message.catch(() => {})
  return { socket, messages, message, opened: once(socket, 'open') }
}

afterEach(async () => {
  for (const socket of sockets.splice(0)) {
    if (socket.readyState === WebSocket.CLOSED) continue
    const closed = once(socket, 'close')
    socket.close()
    await closed
  }
  const children = workers.splice(0)
  for (const child of children) child.kill('SIGTERM')
  for (const result of await Promise.all(children))
    expect(result.stderr).toBe('')
  for (const { client, name } of aclUsers.splice(0))
    await client.acl('DELUSER', name)
  for (const client of clients.splice(0)) client.disconnect()
})

describe.each(['memory', 'redis'] as const)('%s callback sockets', (mode) => {
  test.skipIf(mode === 'redis' && !redisUrl)(
    'delivers a callback completed before subscription once',
    async () => {
      const publisher = await worker(mode === 'redis' ? redisUrl : undefined)
      const subscriber = mode === 'redis' ? await worker(redisUrl) : publisher
      const token = randomUUID()
      expect(await publisher.command('publish', token)).toEqual({ ok: true })
      const connection = connect(subscriber.origin, token)
      await connection.message
      const duplicate = connect(publisher.origin, token)
      await duplicate.opened
      await setTimeout(100)
      expect([...connection.messages, ...duplicate.messages]).toEqual([
        { token: 'fixture-auth-result' },
      ])
    },
  )

  test.skipIf(mode === 'redis' && !redisUrl)(
    'closes a stalled subscription and cleans up late readiness',
    async () => {
      const publisher = await worker(mode === 'redis' ? redisUrl : undefined)
      const subscriber = mode === 'redis' ? await worker(redisUrl) : publisher
      const token = randomUUID()
      expect(await subscriber.command('hold', token)).toEqual({ ok: true })
      const connection = connect(subscriber.origin, token)
      await connection.opened
      expect(await subscriber.child.getOneMessage()).toBe('subscribing')
      const closed = once(connection.socket, 'close', {
        signal: AbortSignal.timeout(6500),
      })
      expect(await publisher.command('publish', token)).toEqual({ ok: true })
      await closed
      expect(await subscriber.command('release', token)).toEqual({ ok: true })
      const retry = connect(publisher.origin, token)
      await retry.message
      expect(connection.messages).toEqual([])
      expect(retry.messages).toEqual([{ token: 'fixture-auth-result' }])
    },
    12_000,
  )
})

test.skipIf(!redisUrl)(
  'atomically consumes scoped Redis results with a bounded TTL',
  async () => {
    const client = new Redis(z.string().parse(redisUrl))
    clients.push(client)
    const publisher = await worker(redisUrl)
    const subscriber = await worker(redisUrl)
    const token = randomUUID()
    await publisher.command('publish', token)
    const keys = await client.keys(`${scope}:*${token}`)
    expect(keys).toHaveLength(1)
    const key = z.string().parse(keys[0])
    expect(await client.ttl(key)).toBeGreaterThan(0)
    expect(await client.ttl(key)).toBeLessThanOrEqual(60)
    const first = connect(publisher.origin, token)
    const second = connect(subscriber.origin, token)
    await Promise.any([first.message, second.message])
    await setTimeout(100)
    expect([...first.messages, ...second.messages]).toEqual([
      { token: 'fixture-auth-result' },
    ])
    expect(await client.exists(key)).toBe(0)
  },
)

test.skipIf(!redisUrl)(
  'shares the retained-result protocol with #6751 workers in both directions',
  async () => {
    const client = new Redis(z.string().parse(redisUrl))
    clients.push(client)
    const current = await worker(redisUrl)
    const previousToken = randomUUID()
    const key = (token: string) => `${scope}:companion:auth-callback:${token}`
    // A previous worker stores this payload and publishes retained=true.
    await client.set(
      key(previousToken),
      JSON.stringify({ token: 'previous-worker' }),
      'EX',
      60,
    )
    const connection = connect(current.origin, previousToken)
    await connection.message
    expect(connection.messages).toEqual([{ token: 'previous-worker' }])
    expect(await client.exists(key(previousToken))).toBe(0)

    const currentToken = randomUUID()
    expect(await current.command('publish', currentToken)).toEqual({ ok: true })
    // A previous consumer must find and atomically consume the current result.
    const results = await client
      .multi()
      .get(key(currentToken))
      .del(key(currentToken))
      .exec()
    expect(results?.[0]).toEqual([
      null,
      JSON.stringify({ token: 'fixture-auth-result' }),
    ])
    expect(await client.exists(key(currentToken))).toBe(0)
  },
)

async function restricted(denied: 'set' | 'get') {
  const url = new URL(z.string().parse(redisUrl))
  const client = new Redis(url.href)
  clients.push(client)
  const name = `callback-test-${randomUUID()}`
  const password = randomUUID()
  await client.acl(
    'SETUSER',
    name,
    'on',
    `>${password}`,
    '~*',
    '&*',
    '+@all',
    `-${denied}`,
  )
  aclUsers.push({ client, name })
  url.username = name
  url.password = password
  return worker(url.href)
}

test.skipIf(!redisUrl)(
  'fails retention without falling back to live pub/sub',
  async () => {
    const publisher = await restricted('set')
    const subscriber = await worker(redisUrl)
    const token = randomUUID()
    const connection = connect(subscriber.origin, token)
    await connection.opened
    await subscriber.command('barrier', token)
    expect(await publisher.command('publish', token)).toEqual({ ok: false })
    await setTimeout(100)
    expect(connection.messages).toEqual([])
  },
)

test.skipIf(!redisUrl)(
  'closes failed replay without publishing an unconsumed copy',
  async () => {
    const publisher = await worker(redisUrl)
    const subscriber = await restricted('get')
    const token = randomUUID()
    await publisher.command('publish', token)
    const connection = connect(subscriber.origin, token)
    await once(connection.socket, 'close', {
      signal: AbortSignal.timeout(2500),
    })
    expect(connection.messages).toEqual([])
    const retry = connect(publisher.origin, token)
    await retry.message
    expect(retry.messages).toEqual([{ token: 'fixture-auth-result' }])
  },
)
