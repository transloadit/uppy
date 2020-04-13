const Uploader = require('../Uploader')
const logger = require('../logger')
const { errorToResponse } = require('../provider/error')

function get (req, res, next) {
  const providerName = req.params.providerName
  const id = req.params.id
  const token = req.companion.providerTokens[providerName]
  const provider = req.companion.provider

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
      return res.status(400).json({ error: 'unable to determine file size' })
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
    // waiting for socketReady.
    uploader.onSocketReady(() => {
      logger.debug('Socket connection received. Starting remote download.', null, req.id)
      provider.download({ id, token, query: req.query }, uploader.handleChunk.bind(uploader))
    })
    const response = uploader.getResponse()
    res.status(response.status).json(response.body)
  })
}

module.exports = get
