const logger = require('../logger')
const { startDownUpload } = require('../helpers/upload')

async function get (req, res) {
  const { id } = req.params
  const { providerUserSession } = req.companion
  const { accessToken } = providerUserSession
  const { provider } = req.companion

  async function getSize () {
    return provider.size({ id, token: accessToken, query: req.query })
  }

  async function download () {
    const { stream } = await provider.download({ id, token: accessToken, providerUserSession, query: req.query })
    return stream
  }

  try {
    await startDownUpload({ req, res, getSize, download })
  } catch (err) {
    logger.error(err, 'controller.get.error', req.id)
    res.status(500).json({ message: 'Failed to download file' })
  }
}

module.exports = get
