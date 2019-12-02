const tokenService = require('./helpers/jwt')
const logger = require('./logger')

exports.hasSessionAndProvider = (req, res, next) => {
  if (!req.session || !req.body) {
    logger.debug('No session/body attached to req object. Exiting dispatcher.', null, req.id)
    return res.sendStatus(400)
  }

  if (!req.companion.provider) {
    logger.debug('No provider/provider-handler found. Exiting dispatcher.', null, req.id)
    return res.sendStatus(400)
  }

  return next()
}

exports.verifyToken = (req, res, next) => {
  const providerName = req.params.providerName
  const { err, payload } = tokenService.verifyToken(req.companion.authToken, req.companion.options.secret)
  if (err || !payload[providerName]) {
    if (err) {
      logger.error(err, 'token.verify.error', req.id)
    }
    return res.sendStatus(401)
  }
  req.companion.providerTokens = payload
  next()
}

// does not fail if token is invalid
exports.gentleVerifyToken = (req, res, next) => {
  const providerName = req.params.providerName
  if (req.companion.authToken) {
    const { err, payload } = tokenService.verifyToken(req.companion.authToken, req.companion.options.secret)
    if (!err && payload[providerName]) {
      req.companion.providerTokens = payload
    }
  }
  next()
}

exports.cookieAuthToken = (req, res, next) => {
  req.companion.authToken = req.cookies[`uppyAuthToken--${req.companion.provider.authProvider}`]
  return next()
}
