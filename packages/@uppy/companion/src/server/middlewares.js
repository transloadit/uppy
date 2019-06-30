const tokenService = require('./helpers/jwt')
const logger = require('./logger')

exports.hasSessionAndProvider = (req, res, next) => {
  if (!req.session || !req.body) {
    logger.debug('No session/body attached to req object. Exiting dispatcher.', null, req.id)
    return res.sendStatus(400)
  }

  if (!req.uppy.provider) {
    logger.debug('No provider/provider-handler found. Exiting dispatcher.', null, req.id)
    return res.sendStatus(400)
  }

  return next()
}

exports.verifyToken = (req, res, next) => {
  const providerName = req.params.providerName
  const { err, payload } = tokenService.verifyToken(req.uppy.authToken, req.uppy.options.secret)
  if (err || !payload[providerName]) {
    return res.sendStatus(401)
  }
  req.uppy.providerTokens = payload
  next()
}

// does not fail if token is invalid
exports.gentleVerifyToken = (req, res, next) => {
  const providerName = req.params.providerName
  if (req.uppy.authToken) {
    const { err, payload } = tokenService.verifyToken(req.uppy.authToken, req.uppy.options.secret)
    if (!err && payload[providerName]) {
      req.uppy.providerTokens = payload
    }
  }
  next()
}

exports.cookieAuthToken = (req, res, next) => {
  req.uppy.authToken = req.cookies[`uppyAuthToken--${req.uppy.provider.authProvider}`]
  return next()
}
