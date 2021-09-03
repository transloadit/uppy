const router = require('express').Router
const request = require('request')
const { URL } = require('url')
const validator = require('validator')

const Uploader = require('../Uploader')
const { getURLMeta, getRedirectEvaluator, getProtectedHttpAgent } = require('../helpers/request')
const logger = require('../logger')
const { errorToResponse } = require('../provider/error')

/**
 * Validates that the download URL is secure
 *
 * @param {string} url the url to validate
 * @param {boolean} debug whether the server is running in debug mode
 */
const validateURL = (url, debug) => {
  if (!url) {
    return false
  }

  const validURLOpts = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: !debug,
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
  const opts = {
    uri: url,
    method: 'GET',
    followRedirect: getRedirectEvaluator(url, blockLocalIPs),
    agentClass: getProtectedHttpAgent((new URL(url)).protocol, blockLocalIPs),
  }

  // return onDataChunk(new Error('test error'))

  return new Promise((resolve, reject) => {
    request(opts)
      .on('response', (resp) => {
        if (resp.statusCode >= 300) {
          reject(new Error(`URL server responded with status: ${resp.statusCode}`))
          return
        }

        // Don't allow any more data to flow yet.
        // https://github.com/request/request/issues/1990#issuecomment-184712275
        resp.pause()
        resolve(resp)
      })
      .on('error', (err) => {
        logger.error(err, 'controller.url.download.error', traceId)
        reject(err)
      })
  })
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
    const { debug } = req.companion.options
    if (!validateURL(req.body.url, debug)) {
      logger.debug('Invalid request body detected. Exiting url meta handler.', null, req.id)
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const urlMeta = await getURLMeta(req.body.url, !debug)
    return res.json(urlMeta)
  } catch (err) {
    logger.error(err, 'controller.url.meta.error', req.id)
    // @todo send more meaningful error message and status code to client if possible
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
  try {
    logger.debug('URL file import handler running', null, req.id)
    const { debug } = req.companion.options
    if (!validateURL(req.body.url, debug)) {
      logger.debug('Invalid request body detected. Exiting url import handler.', null, req.id)
      res.status(400).json({ error: 'Invalid request body' })
      return
    }

    const { size } = await getURLMeta(req.body.url, !debug)

    logger.debug('Instantiating uploader.', null, req.id)
    const uploader = new Uploader(Uploader.reqToOptions(req, size))

    if (uploader.hasError()) {
      const response = uploader.getResponse()
      res.status(response.status).json(response.body)
      return
    }

    const stream = await downloadURL(req.body.url, !debug, req.id)

    // "Forking" off the upload operation to background, so we can return the http request:
    ;(async () => {
      // wait till the client has connected to the socket, before starting
      // the download, so that the client can receive all download/upload progress.
      logger.debug('Waiting for socket connection before beginning remote download/upload.', null, req.id)
      await uploader.awaitReady()
      logger.debug('Socket connection received. Starting remote download/upload.', null, req.id)

      uploader.uploadStream(stream)
    })()

    // Respond the request
    // NOTE: Uploader will continue running after the http request is responded
    const response = uploader.getResponse()
    res.status(response.status).json(response.body)
  } catch (err) {
    const errResp = errorToResponse(err)
    if (errResp) {
      res.status(errResp.code).json({ message: errResp.message })
      return
    }

    logger.error(err, 'controller.url.error', req.id)
    // @todo send more meaningful error message and status code to client if possible
    res.status(err.status || 500).json({ message: 'failed to fetch URL metadata' })
  }
}

module.exports = () => router()
  .post('/meta', meta)
  .post('/get', get)
