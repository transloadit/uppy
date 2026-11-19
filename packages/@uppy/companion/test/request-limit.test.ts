import { once } from 'node:events'
import { createServer } from 'node:http'
import { connect } from 'node:net'
import express, { type Response } from 'express'
import { expect, test, vi } from 'vitest'
import { limitPendingRequests } from '../dist/standalone/request-limit.js'

test('rejects excess pipelined requests before starting their upstream work', async () => {
  const app = express()
  app.use(limitPendingRequests(2))
  const responses: Response[] = []
  app.get('/', (_req, res) => responses.push(res))
  const server = createServer(app)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (address === null || typeof address === 'string')
    throw new Error('No server port')
  const socket = connect(address.port, '127.0.0.1')
  try {
    await once(socket, 'connect')
    let output = ''
    socket.on('data', (data) => {
      output += data.toString()
    })
    socket.write('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n'.repeat(3))
    await vi.waitFor(() => expect(responses).toHaveLength(2))
    for (const response of responses) response.end('done')
    await vi.waitFor(() => expect(output).toContain('429 Too Many Requests'))
  } finally {
    socket.destroy()
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})
