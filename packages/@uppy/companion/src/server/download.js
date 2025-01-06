const logger = require('./logger')
const { getProtectedGot } = require('./helpers/request')
const { prepareStream } = require('./helpers/utils')

/**
 * Downloads the content in the specified url, and passes the data
 * to the callback chunk by chunk.
 *
 * @param {string} url
 * @param {boolean} allowLocalIPs
 * @param {string} traceId
 * @returns {Promise}
 */
const downloadURL = async (url, allowLocalIPs, traceId, options) => {
  try {
    const protectedGot = await getProtectedGot({ allowLocalIPs })
    const stream = protectedGot.stream.get(url, { responseType: 'json', ...options })
    const { size } = await prepareStream(stream)
    return { stream, size }
  } catch (err) {
    logger.error(err, 'controller.url.download.error', traceId)
    throw err
  }
}

module.exports = {
  downloadURL,
}
