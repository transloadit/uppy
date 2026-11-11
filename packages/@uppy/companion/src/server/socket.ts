import type { Server as HttpServer } from 'node:http'
import type { Server as HttpsServer } from 'node:https'
import { type WebSocket, WebSocketServer } from 'ws'
import type { CompanionInitOptions } from '../schemas/companion.js'
import { authCallbackRetentionMs, takeAuthCallback } from './auth-callback.js'
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

async function handleAuthCallbackSocketConnection({
  token,
  ws,
  options,
}: {
  token: string
  ws: WebSocket
  options: CompanionInitOptions
}) {
  const events = emitter()
  const openedAt = Date.now()
  let closed = false
  let sent = false
  let replaysInFlight = 0
  function send(data: unknown) {
    if (closed || sent) return
    sent = true
    ws.send(jsonStringify(data), (err) => {
      if (err)
        logger.error(
          err,
          'socket.auth.redis.error',
          Uploader.shortenToken(token),
        )
    })
  }

  async function replay() {
    if (closed || sent) return
    replaysInFlight++
    let data: unknown
    try {
      data = await takeAuthCallback(token, options)
    } finally {
      replaysInFlight--
    }
    // Consumption is final if the socket closes during this read. Clients
    // already reject closed login sockets instead of reconnecting them.
    // A miss may mean eviction or prior consumption; do not replay live data.
    if (data !== undefined) send(data)
  }

  function onMessage(...args: unknown[]) {
    // Older publishers only emit the payload, without retaining it.
    if (args[1] !== true) send(args[0])
    else replay().catch(onError)
  }

  function onError() {
    // Subscription errors include the callback token in command arguments.
    logger.error('Auth callback failed', 'socket.auth.redis.error')
    closed = true
    ws.close()
  }

  function onResubscribed(downtimeMs: unknown) {
    // A publication may have been lost while the subscriber reconnected; the
    // retained result is still in storage, unless this socket waited through
    // more of the outage than the retention lasts. A result published then
    // may be gone, and we can't tell that from a login still in progress, so
    // settle those rather than risk waiting forever. Logins opened during the
    // outage, or shorter outages, keep waiting.
    replay()
      .then(() => {
        const waited = Math.min(
          typeof downtimeMs === 'number' ? downtimeMs : 0,
          Date.now() - openedAt,
        )
        // Another replay (from a message) may still deliver the result.
        if (sent || closed || replaysInFlight > 0) return
        if (waited < authCallbackRetentionMs) return
        logger.info(
          'Auth callback may have expired during a Redis outage',
          'socket.auth.redis.expired',
        )
        closed = true
        ws.close()
      })
      .catch(onError)
  }

  ws.on('close', () => {
    closed = true
    events.removeListener(token, onMessage)
    events.removeListener('redis:resubscribed', onResubscribed)
  })

  try {
    if (redis.client()) await events.on('redis:resubscribed', onResubscribed)
    // HTTP 101 precedes Redis subscription readiness. Subscribe first, then
    // consume storage, covering callbacks both before and during subscription.
    // Bound this login's wait without changing shared upload retry behavior.
    // Late readiness must remove any listener registered after socket closure.
    const subscribed = Promise.resolve(events.on(token, onMessage)).then(
      async () => {
        if (closed) await events.removeListener(token, onMessage)
      },
    )
    let subscriptionTimer: NodeJS.Timeout | undefined
    try {
      await Promise.race([
        subscribed,
        new Promise<never>((_resolve, reject) => {
          subscriptionTimer = setTimeout(
            () => reject(new Error('Auth callback subscription timed out')),
            5000,
          )
          subscriptionTimer.unref()
        }),
      ])
    } finally {
      clearTimeout(subscriptionTimer)
    }
    if (closed) {
      events.removeListener(token, onMessage)
      return
    }
    await replay()
  } catch {
    onError()
  }
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
        'Auth callback token connection received',
        'socket.auth.callback.connect',
        Uploader.shortenToken(authCallbackToken),
      )

      handleAuthCallbackSocketConnection({
        token: authCallbackToken,
        ws,
        options: companionOptions,
      })
      return
    }

    ws.close()
  })
}
