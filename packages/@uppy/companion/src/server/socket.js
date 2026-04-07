import { WebSocketServer } from 'ws'
import emitter from './emitter/index.js'
import { getURLBuilder, jsonStringify } from './helpers/utils.js'
import * as logger from './logger.js'
import * as redis from './redis.js'
import Uploader from './Uploader.js'

function handleUploadSocketConnection({ token, ws }) {
  // A new connection is usually created when an upload begins,
  // or when connection fails while an upload is on-going and,
  // client attempts to reconnect.

  // the token identifies which ongoing upload's progress, the socket
  // connection wishes to listen to.
  const redisClient = redis.client()

  /**
   *
   * @param {{action: string, payload: object}} data
   */
  function send(data) {
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
      .get(`${Uploader.STORAGE_PREFIX_UPLOAD_TOKEN}:${token}`)
      .then((data) => {
        if (data) {
          const dataObj = JSON.parse(data.toString())
          if (dataObj.action) send(dataObj)
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
  emitter().on(token, send)

  ws.on('message', (jsonData) => {
    try {
      const data = JSON.parse(jsonData.toString())
      // whitelist triggered actions
      if (['pause', 'resume', 'cancel'].includes(data.action)) {
        emitter().emit(`${data.action}:${token}`)
      }
    } catch (err) {
      logger.error(err, 'socket.upload.error', Uploader.shortenToken(token))
    }
  })

  ws.on('close', () => {
    emitter().removeListener(token, send)
  })
}

function handleAuthCallbackSocketConnection({ token, ws }) {
  /**
   *
   * @param {{action: string, payload: object}} data
   */
  function send(data) {
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

export default function setupSockets(server, companionOptions) {
  const wss = new WebSocketServer({ server })

  const urlBuilder = getURLBuilder(companionOptions)

  const externalBasePath = urlBuilder('', true, true)
  console.log('externalBasePath', externalBasePath)

  wss.on('connection', (ws, req) => {
    // basic router:
    let path = req.url
    // strip off base path if any
    if (externalBasePath && path.startsWith(externalBasePath)) {
      path = path.slice(externalBasePath.length)
    }

    // authentication callback token?
    const authCallbackTokenMatch = path.match(
      /^\/api2\/auth-callback\/token\/([^/]+)/,
    )
    const authCallbackToken = authCallbackTokenMatch?.[1]

    // or token that identifies which ongoing upload's progress, the socket connection wishes to listen to.
    const uploadTokenMatch = path.match(/^\/api\/([^/]+)/)
    const uploadToken = uploadTokenMatch?.[1]

    if (uploadToken) {
      logger.info(
        `Upload token connection received from ${uploadToken}`,
        'socket.upload.connect',
      )

      handleUploadSocketConnection({ token: uploadToken, ws })
    } else if (authCallbackToken) {
      logger.info(
        `Auth callback token connection received from ${authCallbackToken}`,
        'socket.auth.callback.connect',
      )

      handleAuthCallbackSocketConnection({ token: authCallbackToken, ws })
    } else {
      ws.close()
      return
    }

    ws.on('error', (err) => {
      // https://github.com/websockets/ws/issues/1543
      // https://github.com/websockets/ws/blob/b73b11828d166e9692a9bffe9c01a7e93bab04a8/test/receiver.test.js#L936
      if (
        err?.name === 'RangeError' &&
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
  })
}
