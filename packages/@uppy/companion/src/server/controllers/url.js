const router = require('express').Router
const request = require('request')
const Uploader = require('../Uploader')
const validator = require('validator')
const utils = require('../helpers/utils')
const logger = require('../logger')
const redis = require('../redis')

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

  if (!validator.isURL(req.body.url, { require_protocol: true, require_tld: !req.uppy.options.debug })) {
    logger.debug('Invalid request body detected. Exiting url meta handler.', null, req.id)
    return res.status(400).json({ error: 'Invalid request body' })
  }

  utils.getURLMeta(req.body.url)
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

  utils.getURLMeta(req.body.url)
    .then(({ size }) => {
      // @ts-ignore
      const { filePath } = req.uppy.options
      logger.debug('Instantiating uploader.', null, req.id)
      const uploader = new Uploader({
        uppyOptions: req.uppy.options,
        endpoint: req.body.endpoint,
        uploadUrl: req.body.uploadUrl,
        protocol: req.body.protocol,
        metadata: req.body.metadata,
        size: size,
        fieldname: req.body.fieldname,
        pathPrefix: `${filePath}`,
        storage: redis.client(),
        headers: req.body.headers
      })

      if (uploader.hasError()) {
        const response = uploader.getResponse()
        res.status(response.status).json(response.body)
        return
      }

      logger.debug('Waiting for socket connection before beginning remote download.', null, req.id)
      uploader.onSocketReady(() => {
        logger.debug('Socket connection received. Starting remote download.', null, req.id)
        downloadURL(req.body.url, uploader.handleChunk.bind(uploader), req.id)
      })

      const response = uploader.getResponse()
      res.status(response.status).json(response.body)
    }).catch((err) => {
      logger.error(err, 'controller.url.get.error', req.id)
      res.json({ err })
    })
}

/**
 * Downloads the content in the specified url, and passes the data
 * to the callback chunk by chunk.
 *
 * @param {string} url
 * @param {typeof Function} onDataChunk
 * @param {string=} traceId
 */
const downloadURL = (url, onDataChunk, traceId) => {
  const opts = {
    uri: url,
    method: 'GET',
    followAllRedirects: true
  }

  request(opts)
    .on('data', onDataChunk)
    .on('end', () => onDataChunk(null))
    .on('error', (err) => logger.error(err, 'controller.url.download.error', traceId))
}
