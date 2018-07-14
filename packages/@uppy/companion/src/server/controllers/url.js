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
  req.uppy.debugLog('URL file import handler running')

  if (!validator.isURL(req.body.url, { require_protocol: true, require_tld: !req.uppy.options.debug })) {
    req.uppy.debugLog('Invalid request body detected. Exiting url meta handler.')
    return res.status(400).json({error: 'Invalid request body'})
  }

  utils.getURLMeta(req.body.url)
    .then((meta) => res.json(meta))
    .catch((err) => {
      logger.error(err, 'controller.url.meta.error')
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
  req.uppy.debugLog('URL file import handler running')

  utils.getURLMeta(req.body.url)
    .then(({ size }) => {
      // @ts-ignore
      const { filePath } = req.uppy.options
      req.uppy.debugLog('Instantiating uploader.')
      const uploader = new Uploader({
        uppyOptions: req.uppy.options,
        endpoint: req.body.endpoint,
        uploadUrl: req.body.uploadUrl,
        protocol: req.body.protocol,
        metadata: req.body.metadata,
        size: size,
        pathPrefix: `${filePath}`,
        storage: redis.client(),
        headers: req.body.headers
      })

      req.uppy.debugLog('Waiting for socket connection before beginning remote download.')
      uploader.onSocketReady(() => {
        req.uppy.debugLog('Socket connection received. Starting remote download.')
        downloadURL(req.body.url, uploader.handleChunk.bind(uploader))
      })

      const response = uploader.getResponse()
      res.status(response.status).json(response.body)
    }).catch((err) => {
      logger.error(err, 'controller.url.get.error')
      res.json({ err })
    })
}

/**
 * Downloads the content in the specified url, and passes the data
 * to the callback chunk by chunk.
 *
 * @param {string} url
 * @param {typeof Function} onDataChunk
 */
const downloadURL = (url, onDataChunk) => {
  const opts = {
    uri: url,
    method: 'GET',
    followAllRedirects: true
  }

  request(opts)
    .on('data', onDataChunk)
    .on('error', (err) => logger.error(err, 'controller.url.download.error'))
}
