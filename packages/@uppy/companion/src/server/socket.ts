import type { Server as HttpServer } from 'node:http'
import type { Server as HttpsServer } from 'node:https'
import { WebSocketServer } from 'ws'
import emitter from './emitter/index.ts'
import { jsonStringify } from './helpers/utils.ts'
import * as logger from './logger.ts'
import * as redis from './redis.ts'
import Uploader from './Uploader.ts'
import { isRecord } from './helpers/type-guards.ts'

type SocketOutgoing = { action: string; payload: Record<string, unknown> }

function isSocketOutgoing(value: unknown): value is SocketOutgoing {
  return (
    isRecord(value) &&
    typeof value.action === 'string' &&
    isRecord(value.payload)
  )
}

function getErrorCode(err: unknown): string | undefined {
  if (!isRecord(err)) return undefined
  const code = err.code
  return typeof code === 'string' ? code : undefined
}

export default function setupSocket(server: HttpServer | HttpsServer): void {
  const wss = new WebSocketServer({ server })
  const redisClient = redis.client()

  wss.on('connection', (ws, req) => {
    const fullPath = req.url ?? ''
    const token = fullPath.replace(/^.*\/api\//, '')
    logger.info(`connection received from ${token}`, 'socket.connect')

    function send(data: SocketOutgoing): void {
      ws.send(jsonStringify(data), (err) => {
        if (err) {
          logger.error(err, 'socket.redis.error', Uploader.shortenToken(token))
        }
      })
    }

    if (redisClient) {
      redisClient
        .get(`${Uploader.STORAGE_PREFIX}:${token}`)
        .then((data) => {
          if (!data) return
          const dataObj: unknown = JSON.parse(data.toString())
          if (isSocketOutgoing(dataObj)) {
            send(dataObj)
          }
        })
        .catch((err) =>
          logger.error(err, 'socket.redis.error', Uploader.shortenToken(token)),
        )
    }

    emitter().emit(`connection:${token}`)
    emitter().on(token, send)

    ws.on('error', (err) => {
      if (err instanceof RangeError && getErrorCode(err) === 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH') {
        logger.error(
          'WebSocket message too large',
          'websocket.error',
          Uploader.shortenToken(token),
        )
      } else {
        logger.error(err, 'websocket.error', Uploader.shortenToken(token))
      }
    })

    ws.on('message', (jsonData) => {
      try {
        const data: unknown = JSON.parse(jsonData.toString())
        const action = isRecord(data) ? data.action : undefined
        if (action === 'pause' || action === 'resume' || action === 'cancel') {
          emitter().emit(`${action}:${token}`)
        }
      } catch (err) {
        logger.error(
          err instanceof Error ? err : String(err),
          'websocket.error',
          Uploader.shortenToken(token),
        )
      }
    })

    ws.on('close', () => {
      emitter().removeListener(token, send)
    })
  })
}
