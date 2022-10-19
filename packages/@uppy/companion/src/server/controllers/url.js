const router = require('express').Router
const validator = require('validator')

const { startDownUpload } = require('../helpers/upload')
const { prepareStream } = require('../helpers/utils')
const { getURLMeta, getProtectedGot } = require('../helpers/request')
const logger = require('../logger')

/**
 * Validates that the download URL is secure
 *
 * @param {string} url the url to validate
 * @param {boolean} ignoreTld whether to allow local addresses
 */
const validateURL = (url, ignoreTld) => {
  if (!url) {
    return false
  }

  const validURLOpts = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: !ignoreTld,
  }
  if (!validator.isURL(url, validURLOpts)) {
    return false
  }

  return true
}

/**
 * @callback downloadCallback
 * @param {Error} err
 * @param {string | Buffer | Buffer[]} chunk
 */

/**
 * Downloads the content in the specified url, and passes the data
 * to the callback chunk by chunk.
 *
 * @param {string} url
 * @param {boolean} blockLocalIPs
 * @param {string} traceId
 * @returns {Promise}
 */
const downloadURL = async (url, blockLocalIPs, traceId) => {
  try {
    const protectedGot = getProtectedGot({ url, blockLocalIPs })
    const stream = protectedGot.stream.get(url, { responseType: 'json' })
    await prepareStream(stream)
    return stream
  } catch (err) {
    logger.error(err, 'controller.url.download.error', traceId)
    throw err
  }
}

/**
 * Fteches the size and content type of a URL
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const meta = async (req, res) => {
  try {
    logger.debug('URL file import handler running', null, req.id)
    const { allowLocalUrls } = req.companion.options
    if (!validateURL(req.body.url, allowLocalUrls)) {
      logger.debug('Invalid request body detected. Exiting url meta handler.', null, req.id)
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const urlMeta = await getURLMeta(req.body.url, !allowLocalUrls)
    return res.json(urlMeta)
  } catch (err) {
    logger.error(err, 'controller.url.meta.error', req.id)
    return res.status(err.status || 500).json({ message: 'failed to fetch URL metadata' })
  }
}

/**
 * Handles the reques of import a file from a remote URL, and then
 * subsequently uploading it to the specified destination.
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const get = async (req, res) => {
  logger.debug('URL file import handler running', null, req.id)
  const { allowLocalUrls } = req.companion.options
  if (!validateURL(req.body.url, allowLocalUrls)) {
    logger.debug('Invalid request body detected. Exiting url import handler.', null, req.id)
    res.status(400).json({ error: 'Invalid request body' })
    return
  }

  async function getSize () {
    const { size } = await getURLMeta(req.body.url, !allowLocalUrls)
    return size
  }

  async function download () {
    return downloadURL(req.body.url, !allowLocalUrls, req.id)
  }

  function onUnhandledError (err) {
    logger.error(err, 'controller.url.error', req.id)
    res.status(err.status || 500).json({ message: 'failed to fetch URL' })
  }

  startDownUpload({ req, res, getSize, download, onUnhandledError })
}

module.exports = () => router()
  .post('/meta', meta)
  .post('/get', get)
