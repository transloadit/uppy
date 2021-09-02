const Uploader = require('../Uploader')
const logger = require('../logger')
const { errorToResponse } = require('../provider/error')

function get (req, res, next) {
  const { id } = req.params
  const token = req.companion.providerToken
  const { provider } = req.companion

  // get the file size before proceeding
  provider.size({ id, token, query: req.query }, (err, size) => {
    if (err) {
      const errResp = errorToResponse(err)
      if (errResp) {
        return res.status(errResp.code).json({ message: errResp.message })
      }
      return next(err)
    }

    if (!size) {
      logger.error('unable to determine file size', 'controller.get.provider.size', req.id)
      return res.status(400).json({ message: 'unable to determine file size' })
    }

    logger.debug('Instantiating uploader.', null, req.id)
    const uploader = new Uploader(Uploader.reqToOptions(req, size))

    if (uploader.hasError()) {
      const response = uploader.getResponse()
      res.status(response.status).json(response.body)
      return
    }

    // wait till the client has connected to the socket, before starting
    // the download, so that the client can receive all download/upload progress.
    logger.debug('Waiting for socket connection before beginning remote download.', null, req.id)
    uploader.awaitReady().then(() => {
      logger.debug('Socket connection received. Starting remote download.', null, req.id)
      provider.download({ id, token, query: req.query }, uploader.handleChunk.bind(uploader))
    }).catch((err2) => logger.error(err2, req.id))

    const response = uploader.getResponse()
    res.status(response.status).json(response.body)
  })
}

module.exports = get
