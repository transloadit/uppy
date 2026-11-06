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
  const emitter = getEmitter(storage, scope)
  emitter.on('error', () => {})
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
  const subscribe = emitter.on.bind(emitter)
  let release: (() => void) | undefined
  while (true) {
    const command = z
      .object({
        operation: z.enum(['publish', 'hold', 'release', 'barrier']),
        token: z.string(),
      })
      .parse(await getOneMessage())
    try {
      if (command.operation === 'publish') {
        await publishAuthCallback(
          command.token,
          { token: 'fixture-auth-result' },
          options,
        )
      } else if (command.operation === 'hold') {
        const held = Promise.withResolvers<void>()
        release = held.resolve
        emitter.on = async (token, handler) => {
          if (token === 'redis:disconnect') return subscribe(token, handler)
          await sendMessage('subscribing')
          await held.promise
          return subscribe(token, handler)
        }
      } else if (command.operation === 'release') {
        release?.()
        emitter.on = subscribe
      } else {
        const noop = () => {}
        await emitter.on(command.token, noop)
        await emitter.removeListener(command.token, noop)
      }
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
