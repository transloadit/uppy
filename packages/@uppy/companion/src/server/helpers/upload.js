const Uploader = require('../Uploader')
const logger = require('../logger')
const { errorToResponse } = require('../provider/error')

const { ValidationError } = Uploader

async function startDownUpload ({ req, res, getSize, download, onUnhandledError }) {
  try {
    const size = await getSize()
    const { clientSocketConnectTimeout } = req.companion.options

    logger.debug('Instantiating uploader.', null, req.id)
    const uploader = new Uploader(Uploader.reqToOptions(req, size))

    logger.debug('Starting download stream.', null, req.id)
    const stream = await download()

    // "Forking" off the upload operation to background, so we can return the http request:
    ;(async () => {
      // wait till the client has connected to the socket, before starting
      // the download, so that the client can receive all download/upload progress.
      logger.debug('Waiting for socket connection before beginning remote download/upload.', null, req.id)
      await uploader.awaitReady(clientSocketConnectTimeout)
      logger.debug('Socket connection received. Starting remote download/upload.', null, req.id)

      await uploader.tryUploadStream(stream)
    })().catch((err) => logger.error(err))

    // Respond the request
    // NOTE: the Uploader will continue running after the http request is responded
    res.status(200).json({ token: uploader.token })
  } catch (err) {
    if (err instanceof ValidationError) {
      logger.debug(err.message, 'uploader.validator.fail')
      res.status(400).json({ message: err.message })
      return
    }

    const errResp = errorToResponse(err)
    if (errResp) {
      res.status(errResp.code).json({ message: errResp.message })
      return
    }

    onUnhandledError(err)
  }
}

module.exports = { startDownUpload }
