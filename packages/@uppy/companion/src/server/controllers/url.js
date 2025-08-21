import express from 'express'
import { downloadURL } from '../download.js'
import { getURLMeta, validateURL } from '../helpers/request.js'
import { startDownUpload } from '../helpers/upload.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'

/**
 * @callback downloadCallback
 * @param {Error} err
 * @param {string | Buffer | Buffer[]} chunk
 */

/**
 * Fetches the size and content type of a URL
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const meta = async (req, res) => {
  try {
    logger.debug('URL file import handler running', null, req.id)
    const { allowLocalUrls } = req.companion.options
    if (!validateURL(req.body.url, allowLocalUrls)) {
      logger.debug(
        'Invalid request body detected. Exiting url meta handler.',
        null,
        req.id,
      )
      res.status(400).json({ error: 'Invalid request body' })
      return
    }

    const urlMeta = await getURLMeta(req.body.url, allowLocalUrls)
    res.json(urlMeta)
  } catch (err) {
    logger.error(err, 'controller.url.meta.error', req.id)
    if (respondWithError(err, res)) return
    res.status(500).json({ message: 'failed to fetch URL metadata' })
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
    logger.debug(
      'Invalid request body detected. Exiting url import handler.',
      null,
      req.id,
    )
    res.status(400).json({ error: 'Invalid request body' })
    return
  }

  const download = () => downloadURL(req.body.url, allowLocalUrls, req.id)

  try {
    await startDownUpload({ req, res, download, getSize: undefined })
  } catch (err) {
    logger.error(err, 'controller.url.error', req.id)
    if (respondWithError(err, res)) return
    res.status(500).json({ message: 'failed to fetch URL' })
  }
}

export default () =>
  express
    .Router()
    .post('/meta', express.json(), meta)
    .post('/get', express.json(), get)
