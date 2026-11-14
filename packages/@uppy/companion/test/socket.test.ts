import { randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { register } from 'prom-client'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from 'vitest'
import WebSocket from 'ws'
import { setDefaultEnv } from './mockserver.js'

const emitter = (await import('../dist/server/emitter/index.js')).default

async function startServer(
  path?: string,
): Promise<{ server: Server; port: number }> {
  setDefaultEnv()
  if (path) process.env['COMPANION_PATH'] = path
  // standalone() registers metrics on the global registry, so a second call would throw
  register.clear()
  const { default: standalone } = await import('../dist/standalone/index.js')
  const { app, companionOptions } = standalone()
  const server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const companion = await import('../dist/companion.js')
  companion.socket(server, companionOptions)
  return { server, port: (server.address() as AddressInfo).port }
}

type Opened = {
  ws: WebSocket
  messages: unknown[]
  closed: Promise<number>
  nextMessage: () => Promise<unknown>
}

const openSockets: WebSocket[] = []

function openSocket(path: string, port: number): Promise<Opened> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`)
    openSockets.push(ws)
    const messages: unknown[] = []
    const waiters: ((m: unknown) => void)[] = []
    ws.on('message', (data) => {
      const m = JSON.parse(data.toString())
      const waiter = waiters.shift()
      if (waiter) waiter(m)
      else messages.push(m)
    })
    ws.on('error', () => {})
    const closed = new Promise<number>((res) => ws.on('close', res))
    const opened: Opened = {
      ws,
      messages,
      closed,
      nextMessage: () =>
        messages.length > 0
          ? Promise.resolve(messages.shift())
          : new Promise((res) => waiters.push(res)),
    }
    ws.on('open', () => resolve(opened))
    ws.on('close', () => resolve(opened))
  })
}

// The server subscribes after the socket opens, and with the Redis emitter
// that takes a round trip: emit until the socket has the message.
async function emitUntilReceived(s: Opened, event: string, payload: unknown) {
  const received = s.nextMessage()
  const timer = setInterval(() => emitter().emit(event, payload), 20)
  emitter().emit(event, payload)
  try {
    return await received
  } finally {
    clearInterval(timer)
  }
}

describe('websocket token validation', () => {
  let server: Server
  let port: number

  beforeAll(async () => {
    ;({ server, port } = await startServer())
  })

  afterAll(async () => {
    for (const ws of openSockets) ws.terminate()
    await new Promise((resolve) => server.close(resolve))
  })

  test('auth socket on a reserved emitter event name is closed and receives nothing', async () => {
    const attacker = await openSocket(
      '/api2/auth-callback/token/newListener',
      port,
    )
    const victimToken = randomUUID()
    const victim = await openSocket(
      `/api2/auth-callback/token/${victimToken}`,
      port,
    )
    await expect(attacker.closed).resolves.toBe(1008)
    expect(attacker.messages).toEqual([])
    expect(
      await emitUntilReceived(victim, victimToken, { token: 'secret' }),
    ).toEqual({ token: 'secret' })
    expect(attacker.messages).toEqual([])
  })

  test('upload socket on a glob pattern is closed', async () => {
    const s = await openSocket('/api/*', port)
    await expect(s.closed).resolves.toBe(1008)
  })

  test.each([
    '/api/not-a-uuid',
    `/api/${randomUUID()}/`,
    `/api/${randomUUID()}?x=1`,
    '/api2/auth-callback/token/newListener',
    '/api2/auth-callback/token/removeListener',
    `/api2/auth-callback/token/${randomUUID()}/extra`,
  ])('rejects %s', async (path) => {
    const s = await openSocket(path, port)
    await expect(s.closed).resolves.toBe(1008)
  })

  test('accepts an upper-case UUID on the auth socket', async () => {
    const token = randomUUID().toUpperCase()
    const s = await openSocket(`/api2/auth-callback/token/${token}`, port)
    expect(await emitUntilReceived(s, token, { token: 't' })).toEqual({
      token: 't',
    })
  })

  test('accepts a UUID upload token and forwards socket messages', async () => {
    const token = randomUUID()
    const s = await openSocket(`/api/${token}`, port)
    const payload = { action: 'progress', payload: { progress: 1 } }
    expect(await emitUntilReceived(s, token, payload)).toEqual(payload)
  })

  test('does not log the full token', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    onTestFinished(() => log.mockRestore())
    const token = randomUUID()
    await openSocket(`/api/${token}`, port)
    await openSocket(`/api2/auth-callback/token/${token}`, port)
    const output = JSON.stringify(log.mock.calls)
    expect(output).toContain('connection received')
    expect(output).not.toContain(token)
    expect(output).toContain(token.slice(0, 8))
  })
})

describe('websocket with COMPANION_PATH', () => {
  let server: Server
  let port: number

  beforeAll(async () => {
    try {
      ;({ server, port } = await startServer('/companion'))
    } finally {
      delete process.env['COMPANION_PATH']
    }
  })

  afterAll(async () => {
    for (const ws of openSockets) ws.terminate()
    await new Promise((resolve) => server.close(resolve))
  })

  test('strips COMPANION_PATH before matching', async () => {
    const token = randomUUID()
    const s = await openSocket(`/companion/api/${token}`, port)
    expect(
      await emitUntilReceived(s, token, { action: 'progress', payload: {} }),
    ).toMatchObject({ action: 'progress' })
  })
})
