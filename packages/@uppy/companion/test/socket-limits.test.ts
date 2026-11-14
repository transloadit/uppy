import { randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { register } from 'prom-client'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import WebSocket from 'ws'
import { setDefaultEnv } from './mockserver.js'

vi.mock('express-prom-bundle')

let server: Server
let port: number

beforeAll(async () => {
  setDefaultEnv()
  // standalone() registers prom-client metrics; clear so a second instance in
  // this process does not throw on duplicate registration.
  register.clear()
  const { default: standalone } = await import('../dist/standalone/index.js')
  const companion = await import('../dist/companion.js')
  const { app, companionOptions } = standalone()
  server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  port = (server.address() as AddressInfo).port
  companion.socket(server, companionOptions)
})

const sockets: WebSocket[] = []

afterAll(async () => {
  for (const ws of sockets) ws.terminate()
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

function openSocket(path: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`)
    sockets.push(ws)
    ws.once('open', () => resolve(ws))
    ws.once('error', reject)
  })
}

const closeCode = (ws: WebSocket) =>
  new Promise<number>((resolve) => ws.once('close', (code) => resolve(code)))

describe('upload socket message limits', () => {
  test('closes the connection with 1009 when a message exceeds 1 KiB', async () => {
    const ws = await openSocket(`/api/${randomUUID()}`)
    const closed = closeCode(ws)
    ws.send('['.repeat(2048))
    await expect(closed).resolves.toBe(1009)
  })

  test('forwards a pause message', async () => {
    const emitter = (await import('../dist/server/emitter/index.js')).default
    const token = randomUUID()
    const onPause = vi.fn()
    // the Redis emitter subscribes asynchronously
    await emitter().on(`pause:${token}`, onPause)
    const ws = await openSocket(`/api/${token}`)
    ws.send(JSON.stringify({ action: 'pause' }))
    await vi.waitFor(() => expect(onPause).toHaveBeenCalledTimes(1))
    ws.close()
  })
})
