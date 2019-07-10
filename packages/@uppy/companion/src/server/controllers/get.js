const Uploader = require('../Uploader')
const redis = require('../redis')
const logger = require('../logger')

function get (req, res, next) {
  const providerName = req.params.providerName
  const id = req.params.id
  const body = req.body
  const token = req.uppy.providerTokens[providerName]
  const provider = req.uppy.provider
  const { providerOptions } = req.uppy.options

  // get the file size before proceeding
  provider.size({ id, token }, (err, size) => {
    if (err) {
      return err.isAuthError ? res.sendStatus(401) : next(err)
    }

    if (!size) {
      logger.error('unable to determine file size', 'controller.get.provider.size', req.id)
      return res.status(400).json({ error: 'unable to determine file size' })
    }

    logger.debug('Instantiating uploader.', null, req.id)
    const uploader = new Uploader({
      uppyOptions: req.uppy.options,
      endpoint: body.endpoint,
      uploadUrl: body.uploadUrl,
      protocol: body.protocol,
      metadata: body.metadata,
      size: size,
      fieldname: body.fieldname,
      pathPrefix: `${req.uppy.options.filePath}`,
      storage: redis.client(),
      s3: req.uppy.s3Client ? {
        client: req.uppy.s3Client,
        options: providerOptions.s3
      } : null,
      headers: body.headers
    })

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
