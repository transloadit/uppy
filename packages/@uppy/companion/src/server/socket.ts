import type { Server as HttpServer } from 'node:http'
import type { Server as HttpsServer } from 'node:https'
import { type WebSocket, WebSocketServer } from 'ws'
import type { CompanionInitOptions } from '../schemas/companion.js'
import emitter from './emitter/index.js'
import { isRecord } from './helpers/type-guards.js'
import { getURLBuilder, jsonStringify } from './helpers/utils.js'
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

function handleUploadSocketConnection({
  token,
  ws,
}: {
  token: string
  ws: WebSocket
}) {
  // A new connection is usually created when an upload begins,
  // or when connection fails while an upload is on-going and,
  // client attempts to reconnect.

  // the token identifies which ongoing upload's progress, the socket
  // connection wishes to listen to.
  const redisClient = redis.client()

  function send(data: { action: string; payload: object }) {
    ws.send(jsonStringify(data), (err) => {
      if (err)
        logger.error(
          err,
          'socket.upload.redis.error',
          Uploader.shortenToken(token),
        )
    })
  }

  // if the redisClient is available, then we attempt to check the storage
  // if we have any already stored state on the upload.
  if (redisClient) {
    redisClient
      .get(`${Uploader.STORAGE_PREFIX}:${token}`)
      .then((data) => {
        if (data) {
          const dataObj = JSON.parse(data.toString())
          if (isSocketMessage(dataObj)) send(dataObj)
        }
      })
      .catch((err) =>
        logger.error(
          err,
          'socket.upload.redis.error',
          Uploader.shortenToken(token),
        ),
      )
  }

  emitter().emit(`connection:${token}`)
  const onRedisMessage = (...args: unknown[]) => {
    const data = args[0]
    if (!isSocketMessage(data)) return
    send(data)
  }
  emitter().on(token, onRedisMessage)

  ws.on('message', (jsonData) => {
    try {
      const data: unknown = JSON.parse(jsonData.toString())
      // whitelist triggered actions
      const action = isRecord(data) ? data['action'] : undefined
      if (action === 'pause' || action === 'resume' || action === 'cancel') {
        emitter().emit(`${action}:${token}`)
      }
    } catch (err) {
      logger.error(err, 'websocket.error', Uploader.shortenToken(token))
    }
  })

  ws.on('close', () => {
    emitter().removeListener(token, onRedisMessage)
  })
}

function handleAuthCallbackSocketConnection({
  token,
  ws,
}: {
  token: string
  ws: WebSocket
}) {
  function send(data: unknown) {
    ws.send(jsonStringify(data), (err) => {
      if (err)
        logger.error(
          err,
          'socket.auth.redis.error',
          Uploader.shortenToken(token),
        )
    })
  }

  // todo we should use a unique prefix for these and upload tokens, so that we can easily distinguish them in the emitter and avoid any potential conflicts.
  // but it's a breaking change so let's not do it now
  // it's unlikely there will be any collision
  emitter().on(token, send)

  ws.on('close', () => {
    emitter().removeListener(token, send)
  })
}

export default function setupSockets(
  server: HttpServer | HttpsServer,
  companionOptions: CompanionInitOptions,
) {
  const wss = new WebSocketServer({ server })

  const urlBuilder = getURLBuilder(companionOptions)

  const externalBasePath = urlBuilder('', true, true)

  wss.on('connection', (ws, req) => {
    // basic router:
    let path = req.url

    // strip off base path if any
    if (path != null && externalBasePath && path.startsWith(externalBasePath)) {
      path = path.slice(externalBasePath.length)
    }

    // authentication callback token?
    const authCallbackTokenMatch = path?.match(
      /^\/api2\/auth-callback\/token\/([^/]+)/,
    )
    const authCallbackToken = authCallbackTokenMatch?.[1]

    // or token that identifies which ongoing upload's progress, the socket connection wishes to listen to.
    const uploadTokenMatch = path?.match(/^\/api\/([^/]+)/)
    const uploadToken = uploadTokenMatch?.[1]

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
          'socket.upload.error',
          uploadToken && Uploader.shortenToken(uploadToken),
        )
      } else {
        logger.error(
          err,
          'socket.error',
          uploadToken && Uploader.shortenToken(uploadToken),
        )
      }
    })

    if (uploadToken) {
      logger.info(
        `Upload token connection received from ${uploadToken}`,
        'socket.upload.connect',
      )

      handleUploadSocketConnection({ token: uploadToken, ws })
      return
    }

    if (authCallbackToken) {
      logger.info(
        `Auth callback token connection received from ${authCallbackToken}`,
        'socket.auth.callback.connect',
      )

      handleAuthCallbackSocketConnection({ token: authCallbackToken, ws })
      return
    }

    ws.close()
  })
}
