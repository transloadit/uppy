import { WebSocketServer } from 'ws'
import emitter from './emitter/index.js'
import { jsonStringify } from './helpers/utils.js'
import * as logger from './logger.js'
import * as redis from './redis.js'
import Uploader from './Uploader.js'

/**
 * the socket is used to send progress events during an upload
 *
 * @param {import('http').Server | import('https').Server} server
 */
export default function setupSocket(server) {
  const wss = new WebSocketServer({ server })
  const redisClient = redis.client()

  // A new connection is usually created when an upload begins,
  // or when connection fails while an upload is on-going and,
  // client attempts to reconnect.
  wss.on('connection', (ws, req) => {
    const fullPath = req.url
    // the token identifies which ongoing upload's progress, the socket
    // connection wishes to listen to.
    const token = fullPath.replace(/^.*\/api\//, '')
    logger.info(`connection received from ${token}`, 'socket.connect')

    /**
     *
     * @param {{action: string, payload: object}} data
     */
    function send(data) {
      ws.send(jsonStringify(data), (err) => {
        if (err)
          logger.error(err, 'socket.redis.error', Uploader.shortenToken(token))
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
            if (dataObj.action) send(dataObj)
          }
        })
        .catch((err) =>
          logger.error(err, 'socket.redis.error', Uploader.shortenToken(token)),
        )
    }

    emitter().emit(`connection:${token}`)
    emitter().on(token, send)

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
          'websocket.error',
          Uploader.shortenToken(token),
        )
      } else {
        logger.error(err, 'websocket.error', Uploader.shortenToken(token))
      }
    })

    ws.on('message', (jsonData) => {
      try {
        const data = JSON.parse(jsonData.toString())
        // whitelist triggered actions
        if (['pause', 'resume', 'cancel'].includes(data.action)) {
          emitter().emit(`${data.action}:${token}`)
        }
      } catch (err) {
        logger.error(err, 'websocket.error', Uploader.shortenToken(token))
      }
    })

    ws.on('close', () => {
      emitter().removeListener(token, send)
    })
  })
}
