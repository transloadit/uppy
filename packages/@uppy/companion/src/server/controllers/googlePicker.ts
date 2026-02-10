import assert from 'node:assert'
import express from 'express'
import { downloadURL } from '../download.js'
import { validateURL } from '../helpers/request.js'
import { startDownUpload } from '../helpers/upload.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'
import { streamGoogleFile } from '../provider/google/drive/index.js'

const getAuthHeader = (token) => ({ authorization: `Bearer ${token}` })

/**
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const get = async (req, res) => {
  try {
    logger.debug('Google Picker file import handler running', null, req.id)

    const allowLocalUrls = false

    const { accessToken, platform, fileId } = req.body

    assert(platform === 'drive' || platform === 'photos')

    if (platform === 'photos' && !validateURL(req.body.url, allowLocalUrls)) {
      res.status(400).json({ error: 'Invalid URL' })
      return
    }

    const download = () => {
      if (platform === 'drive') {
        return streamGoogleFile({ token: accessToken, id: fileId })
      }
      return downloadURL(req.body.url, allowLocalUrls, req.id, {
        headers: getAuthHeader(accessToken),
      })
    }

    await startDownUpload({ req, res, download, getSize: undefined })
  } catch (err) {
    logger.error(err, 'controller.googlePicker.error', req.id)
    if (respondWithError(err, res)) return
    res.status(500).json({ message: 'failed to fetch Google Picker URL' })
  }
}

export default () => express.Router().post('/get', express.json(), get)
