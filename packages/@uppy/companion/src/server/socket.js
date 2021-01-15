const SocketServer = require('ws').Server
const { jsonStringify } = require('./helpers/utils')
const emitter = require('./emitter')
const redis = require('./redis')
const logger = require('./logger')
const { STORAGE_PREFIX, shortenToken } = require('./Uploader')

/**
 * the socket is used to send progress events during an upload
 *
 * @param {object} server
 */
module.exports = (server) => {
  const wss = new SocketServer({ server })
  const redisClient = redis.client()

  // A new connection is usually created when an upload begins,
  // or when connection fails while an upload is on-going and,
  // client attempts to reconnect.
  wss.on('connection', (ws, req) => {
    // @ts-ignore
    const fullPath = req.url
    // the token identifies which ongoing upload's progress, the socket
    // connection wishes to listen to.
    const token = fullPath.replace(/^.*\/api\//, '')
    logger.info(`connection received from ${token}`, 'socket.connect')

    /**
     *
     * @param {{action: string, payload: object}} data
     */
    function sendProgress (data) {
      ws.send(jsonStringify(data), (err) => {
        if (err) logger.error(err, 'socket.progress.error', shortenToken(token))
      })
    }

    // if the redisClient is available, then we attempt to check the storage
    // if we have any already stored progress data on the upload.
    if (redisClient) {
      redisClient.get(`${STORAGE_PREFIX}:${token}`, (err, data) => {
        if (err) logger.error(err, 'socket.redis.error', shortenToken(token))
        if (data) {
          const dataObj = JSON.parse(data.toString())
          if (dataObj.action) sendProgress(dataObj)
        }
      })
    }

    emitter().emit(`connection:${token}`)
    emitter().on(token, sendProgress)

    ws.on('message', (jsonData) => {
      const data = JSON.parse(jsonData.toString())
      // whitelist triggered actions
      if (['pause', 'resume', 'cancel'].includes(data.action)) {
        emitter().emit(`${data.action}:${token}`)
      }
    })

    ws.on('close', () => {
      emitter().removeListener(token, sendProgress)
    })
  })
}
