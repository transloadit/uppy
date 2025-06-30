const logger = require('../logger')
const { startDownUpload } = require('../helpers/upload')
const { respondWithError } = require('../provider/error')


async function get (req, res) {
  const { id } = req.params
  const { providerUserSession } = req.companion
  const { provider } = req.companion

  async function getSize () {
    return provider.size({ id, providerUserSession, query: req.query })
  }

  const download = () => provider.download({ id, providerUserSession, query: req.query })

  try {
    await startDownUpload({ req, res, getSize, download })
  } catch (err) {
    logger.error(err, 'controller.get.error', req.id)
    if (respondWithError(err, res)) return
    res.status(500).json({ message: 'Failed to download file' })
  }
}

module.exports = get
