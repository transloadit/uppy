const express = require('express')
const assert = require('node:assert')

const { startDownUpload } = require('../helpers/upload')
const { validateURL } = require('../helpers/request')
const logger = require('../logger')
const { downloadURL } = require('../download')
const { streamGoogleFile } = require('../provider/google/drive');
const { respondWithError } = require('../provider/error')


const getAuthHeader = (token) => ({ authorization: `Bearer ${token}` });

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

    assert(platform === 'drive' || platform === 'photos');
    
    if (platform === 'photos' && !validateURL(req.body.url, allowLocalUrls)) {
      res.status(400).json({ error: 'Invalid URL' })
      return
    }

    const download = () => {
      if (platform === 'drive') {
        return streamGoogleFile({ token: accessToken, id: fileId })
      }
      return downloadURL(req.body.url, allowLocalUrls, req.id, { headers: getAuthHeader(accessToken) })
    }

    await startDownUpload({ req, res, download, getSize: undefined })
  } catch (err) {
    logger.error(err, 'controller.googlePicker.error', req.id)
    if (respondWithError(err, res)) return
    res.status(500).json({ message: 'failed to fetch Google Picker URL' })
  }
}

module.exports = () => express.Router()
  .post('/get', express.json(), get)
