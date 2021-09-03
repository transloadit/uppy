const Uploader = require('../Uploader')
const logger = require('../logger')
const { errorToResponse } = require('../provider/error')

async function get (req, res) {
  const { id } = req.params
  const token = req.companion.providerToken
  const { provider } = req.companion

  try {
    const size = await provider.size({ id, token, query: req.query })

    logger.debug('Instantiating uploader.', null, req.id)
    const uploader = new Uploader(Uploader.reqToOptions(req, size))

    if (uploader.hasError()) {
      const response = uploader.getResponse()
      res.status(response.status).json(response.body)
      return
    }

    const { stream } = await provider.download({ id, token, query: req.query })

    // "Forking" off the upload operation to background, so we can return the http request:
    ;(async () => {
      // wait till the client has connected to the socket, before starting
      // the download, so that the client can receive all download/upload progress.
      logger.debug('Waiting for socket connection before beginning remote download/upload.', null, req.id)
      await uploader.awaitReady()
      logger.debug('Socket connection received. Starting remote download/upload.', null, req.id)

      uploader.uploadStream(stream)
    })()

    // Respond the request
    // NOTE: Uploader will continue running after the http request is responded
    const response = uploader.getResponse()
    res.status(response.status).json(response.body)
  } catch (err) {
    const errResp = errorToResponse(err)
    if (errResp) {
      res.status(errResp.code).json({ message: errResp.message })
      return
    }

    logger.error(err, 'controller.get.error', req.id)
    res.status(400).json({ message: 'Failed to download file' })
  }
}

module.exports = get
