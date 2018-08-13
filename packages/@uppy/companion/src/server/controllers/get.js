const Uploader = require('../Uploader')
const redis = require('../redis')
const logger = require('../logger')

function get (req, res) {
  const providerName = req.params.providerName
  const id = req.params.id
  const body = req.body
  const token = req.uppy.providerTokens[providerName]
  const provider = req.uppy.provider
  const { providerOptions } = req.uppy.options

  // get the file size before proceeding
  provider.size({ id, token }, (size) => {
    if (!size) {
      logger.error('unable to determine file size', 'controller.get.provider.size')
      return res.status(400).json({error: 'unable to determine file size'})
    }

    req.uppy.debugLog('Instantiating uploader.')
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

    // wait till the client has connected to the socket, before starting
    // the download, so that the client can receive all download/upload progress.
    req.uppy.debugLog('Waiting for socket connection before beginning remote download.')
    // waiting for socketReady.
    uploader.onSocketReady(() => {
      req.uppy.debugLog('Socket connection received. Starting remote download.')
      provider.download({ id, token, query: req.query }, uploader.handleChunk.bind(uploader))
    })
    const response = uploader.getResponse()
    res.status(response.status).json(response.body)
  })
}

module.exports = get
