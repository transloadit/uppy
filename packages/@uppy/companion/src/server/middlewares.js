const tokenService = require('./helpers/jwt')

exports.hasSessionAndProvider = (req, res, next) => {
  if (!req.session || !req.body) {
    req.uppy.debugLog('No session/body attached to req object. Exiting dispatcher.')
    return res.sendStatus(400)
  }

  if (!req.uppy.provider) {
    req.uppy.debugLog('No provider/provider-handler found. Exiting dispatcher.')
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
  req.uppy.authToken = req.cookies.uppyAuthToken
  return next()
}
