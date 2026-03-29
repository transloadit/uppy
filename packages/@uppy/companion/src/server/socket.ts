import assert from 'node:assert'
import type { Server as HttpServer } from 'node:http'
import type { Server as HttpsServer } from 'node:https'
import { WebSocketServer } from 'ws'
import emitter from './emitter/index.js'
import { isRecord } from './helpers/type-guards.js'
import { jsonStringify } from './helpers/utils.js'
import * as logger from './logger.js'
import * as redis from './redis.js'
import Uploader from './Uploader.js'

type SocketMessage = { action: string; payload: Record<string, unknown> }

function isSocketMessage(value: unknown): value is SocketMessage {
  return (
    isRecord(value) &&
    typeof value['action'] === 'string' &&
    isRecord(value['payload'])
  )
}

/**
 * The socket is used to send progress events during an upload.
 */
export default function setupSocket(server: HttpServer | HttpsServer): void {
  const wss = new WebSocketServer({ server })
  const redisClient = redis.client()

  // A new connection is usually created when an upload begins,
  // or when connection fails while an upload is on-going and,
  // client attempts to reconnect.
  wss.on('connection', (ws, req) => {
    const fullPath = req.url
    assert(fullPath != null, 'WebSocket connection URL is missing')
    // the token identifies which ongoing upload's progress, the socket
    // connection wishes to listen to.
    const token = fullPath.replace(/^.*\/api\//, '')
    logger.info(`connection received from ${token}`, 'socket.connect')

    function send(data: SocketMessage): void {
      ws.send(jsonStringify(data), (err) => {
        if (err) {
          logger.error(err, 'socket.redis.error', Uploader.shortenToken(token))
        }
      })
    }

    // if the redisClient is available, then we attempt to check the storage
    // if we have any already stored state on the upload, and send it to the client immediately after connection,
    // so that the client can update the UI accordingly without the user having to wait for another event
    if (redisClient) {
      redisClient
        .get(`${Uploader.STORAGE_PREFIX}:${token}`)
        .then((data) => {
          if (!data) return
          const dataObj: unknown = JSON.parse(data)
          if (isSocketMessage(dataObj)) {
            send(dataObj)
          }
        })
        .catch((err) =>
          logger.error(err, 'socket.redis.error', Uploader.shortenToken(token)),
        )
    }

    emitter().emit(`connection:${token}`)
    const onTokenMessage = (...args: unknown[]) => {
      const data = args[0]
      if (!isSocketMessage(data)) return
      send(data)
    }
    emitter().on(token, onTokenMessage)

    ws.on('error', (err) => {
      // https://github.com/websockets/ws/issues/1543
      // https://github.com/websockets/ws/blob/b73b11828d166e9692a9bffe9c01a7e93bab04a8/test/receiver.test.js#L936
      if (
        err.name === 'RangeError' &&
        'code' in err &&
        err.code === 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'
      ) {
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
        // whitelist triggered actions
        const action = isRecord(data) ? data['action'] : undefined
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
      emitter().removeListener(token, onTokenMessage)
    })
  })
}
