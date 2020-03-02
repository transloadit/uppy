const router = require('express').Router
const request = require('request')
const Uploader = require('../Uploader')
const validator = require('validator')
const utils = require('../helpers/utils')
const { getProtectedHttpAgent } = require('../helpers/request')
const logger = require('../logger')

module.exports = () => {
  return router()
    .post('/meta', meta)
    .post('/get', get)
}

/**
 * Fteches the size and content type of a URL
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const meta = (req, res) => {
  logger.debug('URL file import handler running', null, req.id)
  const debug = req.companion.options.debug
  if (!validateURL(req.body.url, debug)) {
    logger.debug('Invalid request body detected. Exiting url meta handler.', null, req.id)
    return res.status(400).json({ error: 'Invalid request body' })
  }

  utils.getURLMeta(req.body.url, !debug)
    .then((meta) => res.json(meta))
    .catch((err) => {
      logger.error(err, 'controller.url.meta.error', req.id)
      return res.status(500).json({ error: err })
    })
}

/**
 * Handles the reques of import a file from a remote URL, and then
 * subsequently uploading it to the specified destination.
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const get = (req, res) => {
  logger.debug('URL file import handler running', null, req.id)
  const debug = req.companion.options.debug
  if (!validateURL(req.body.url, debug)) {
    logger.debug('Invalid request body detected. Exiting url import handler.', null, req.id)
    return res.status(400).json({ error: 'Invalid request body' })
  }

  utils.getURLMeta(req.body.url)
    .then(({ size }) => {
      // @ts-ignore
      logger.debug('Instantiating uploader.', null, req.id)
      const uploader = new Uploader(Uploader.reqToOptions(req, size))

      if (uploader.hasError()) {
        const response = uploader.getResponse()
        res.status(response.status).json(response.body)
        return
      }

      logger.debug('Waiting for socket connection before beginning remote download.', null, req.id)
      uploader.onSocketReady(() => {
        logger.debug('Socket connection received. Starting remote download.', null, req.id)
        downloadURL(req.body.url, uploader.handleChunk.bind(uploader), !debug, req.id)
      })

      const response = uploader.getResponse()
      res.status(response.status).json(response.body)
    }).catch((err) => {
      logger.error(err, 'controller.url.get.error', req.id)
      // @todo this should send back error (not err)
      res.json({ err })
    })
}

/**
 * Validates that the download URL is secure
 * @param {string} url the url to validate
 * @param {boolean} debug whether the server is running in debug mode
 */
const validateURL = (url, debug) => {
  const validURLOpts = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: !debug
  }
  if (!validator.isURL(url, validURLOpts)) {
    return false
  }

  return true
}

/**
 * Downloads the content in the specified url, and passes the data
 * to the callback chunk by chunk.
 *
 * @param {string} url
 * @param {typeof Function} onDataChunk
 * @param {boolean} blockLocalIPs
 * @param {string=} traceId
 */
const downloadURL = (url, onDataChunk, blockLocalIPs, traceId) => {
  const opts = {
    uri: url,
    method: 'GET',
    followAllRedirects: true,
    agentClass: getProtectedHttpAgent(utils.parseURL(url).protocol, blockLocalIPs)
  }

  request(opts)
    .on('data', onDataChunk)
    .on('end', () => onDataChunk(null))
    .on('error', (err) => logger.error(err, 'controller.url.download.error', traceId))
}
