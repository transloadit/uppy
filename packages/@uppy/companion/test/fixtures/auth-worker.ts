import { once } from 'node:events'
import { createServer } from 'node:http'

import { getOneMessage, sendMessage } from 'execa'
import { z } from 'zod'

import { publishAuthCallback } from '../../dist/server/auth-callback.js'
import getEmitter from '../../dist/server/emitter/index.js'
import * as redis from '../../dist/server/redis.js'
import setupSockets from '../../dist/server/socket.js'

async function main(): Promise<void> {
  const { redisUrl, scope } = z
    .object({ redisUrl: z.string().optional(), scope: z.string() })
    .parse(await getOneMessage())
  const storage = redisUrl ? redis.client({ redisUrl }) : undefined
  getEmitter(storage, scope)
  const server = createServer((_request, response) => {
    response.writeHead(404).end()
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (address == null || typeof address === 'string')
    throw new Error('Expected TCP listener')
  const origin = `http://127.0.0.1:${address.port}`
  const options = {
    secret: 'fixture',
    filePath: '/tmp',
    server: { host: `127.0.0.1:${address.port}`, protocol: 'http' },
    redisPubSubScope: scope,
  }
  setupSockets(server, options)
  await sendMessage({ origin })
  while (true) {
    const { token } = z
      .object({ operation: z.literal('publish'), token: z.string() })
      .parse(await getOneMessage())
    try {
      await publishAuthCallback(
        token,
        { token: 'fixture-auth-result' },
        options,
      )
      await sendMessage({ ok: true })
    } catch {
      await sendMessage({ ok: false })
    }
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
