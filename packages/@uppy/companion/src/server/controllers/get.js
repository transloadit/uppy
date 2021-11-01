const logger = require('../logger')
const { startDownUpload } = require('../helpers/upload')

async function get (req, res) {
  const { id } = req.params
  const token = req.companion.providerToken
  const { provider } = req.companion

  async function getSize () {
    return provider.size({ id, token, query: req.query })
  }

  async function download () {
    const { stream } = await provider.download({ id, token, query: req.query })
    return stream
  }

  function onUnhandledError (err) {
    logger.error(err, 'controller.get.error', req.id)
    res.status(400).json({ message: 'Failed to download file' })
  }

  startDownUpload({ req, res, getSize, download, onUnhandledError })
}

module.exports = get
