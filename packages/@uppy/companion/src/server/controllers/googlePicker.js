const express = require('express')
const assert = require('node:assert')

const { startDownUpload } = require('../helpers/upload')
const { validateURL } = require('../helpers/request')
const { getURLMeta } = require('../helpers/request')
const logger = require('../logger')
const { downloadURL } = require('../download')
const { getGoogleFileSize, streamGoogleFile } = require('../provider/google/drive');


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

    const getSize = async () => {
      if (platform === 'drive') {
        return getGoogleFileSize({ id: fileId, token: accessToken })
      }
      const { size } = await getURLMeta(req.body.url, allowLocalUrls, { headers: getAuthHeader(accessToken) })
      return size
    }
    
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

    await startDownUpload({ req, res, getSize, download })
  } catch (err) {
    logger.error(err, 'controller.googlePicker.error', req.id)
    res.status(err.status || 500).json({ message: 'failed to fetch Google Picker URL' })
  }
}

module.exports = () => express.Router()
  .post('/get', express.json(), get)