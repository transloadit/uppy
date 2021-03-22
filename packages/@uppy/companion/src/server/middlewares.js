const uniq = require('lodash/uniq')
const cors = require('cors')

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
  const { providerName } = req.params
  const { err, payload } = tokenService.verifyEncryptedToken(token, req.companion.options.secret)
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
  const { providerName } = req.params
  if (req.companion.authToken) {
    const { err, payload } = tokenService.verifyEncryptedToken(req.companion.authToken, req.companion.options.secret)
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

exports.cors = (options = {}) => (req, res, next) => {
  const exposedHeaders = [
    // exposed so it can be accessed for our custom uppy client preflight
    'Access-Control-Allow-Headers',
  ]
  if (options.sendSelfEndpoint) exposedHeaders.push('i-am')
  if (res.get('Access-Control-Expose-Headers')) exposedHeaders.push(res.get('Access-Control-Expose-Headers'))

  const allowedHeaders = [
    'uppy-auth-token',
    'uppy-versions',
    'uppy-credentials-params',
  ]
  if (res.get('Access-Control-Allow-Headers')) allowedHeaders.push(res.get('Access-Control-Allow-Headers'))

  const existingAllowMethodsHeader = res.get('Access-Control-Allow-Methods')
  let methods = []
  if (existingAllowMethodsHeader) {
    methods = existingAllowMethodsHeader.replace(/\s/g, '').split(',').map((method) => method.toUpperCase())
  }
  methods = uniq([...methods, 'GET', 'POST', 'OPTIONS', 'DELETE'])

  // If endpoint urls are specified, then we only allow those endpoints.
  // Otherwise, we allow any client url to access companion.
  // Must be set to at least true (origin "*" with "credentials: true" will cause error in many browsers)
  // https://github.com/expressjs/cors/issues/119
  // allowedOrigins can also be any type supported by https://github.com/expressjs/cors#configuration-options
  const { corsOrigins: origin = true } = options

  // Because we need to merge with existing headers, we need to call cors inside our own middleware
  return cors({
    credentials: true,
    origin,
    methods,
    allowedHeaders: allowedHeaders.join(','),
    exposedHeaders: exposedHeaders.join(','),
  })(req, res, next)
}
