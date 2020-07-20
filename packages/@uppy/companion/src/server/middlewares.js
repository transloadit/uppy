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

exports.hasSearchQuery = (req, res, next) => {
  if (typeof req.query.q !== 'string') {
    logger.debug('search request has no search query', 'search.query.check', req.id)
    return res.sendStatus(400)
  }

  return next()
}

exports.verifyToken = (req, res, next) => {
  const token = req.companion.authToken
  if (token == null) {
    logger.info('cannot auth token', 'token.verify.unset', req.id)
    return res.sendStatus(401)
  }
  const providerName = req.params.providerName
  const { err, payload } = tokenService.verifyToken(token, req.companion.options.secret)
  if (err || !payload[providerName]) {
    if (err) {
      logger.error(err, 'token.verify.error', req.id)
    }
    return res.sendStatus(401)
  }
  req.companion.providerTokens = payload
  req.companion.providerToken = payload[providerName]
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

exports.loadSearchProviderToken = (req, res, next) => {
  const { searchProviders } = req.companion.options.providerOptions
  const providerName = req.params.searchProviderName
  if (!searchProviders || !searchProviders[providerName] || !searchProviders[providerName].key) {
    logger.info(`unconfigured credentials for ${providerName}`, 'searchtoken.load.unset', req.id)
    return res.sendStatus(501)
  }

  req.companion.providerToken = searchProviders[providerName].key
  next()
}
