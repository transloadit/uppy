const cors = require('cors')
// @ts-ignore
const promBundle = require('express-prom-bundle')

// @ts-ignore
const { version } = require('../../package.json')
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
  // HTTP headers are not case sensitive, and express always handles them in lower case, so that's why we lower case them.
  // I believe that HTTP verbs are case sensitive, and should be uppercase.

  // TODO: Move to optional chaining when we drop Node.js v12.x support
  const existingExposeHeaders = res.get('Access-Control-Expose-Headers')
  const exposeHeadersSet = new Set(existingExposeHeaders && existingExposeHeaders.split(',').map(method => method.trim().toLowerCase()))

  // exposed so it can be accessed for our custom uppy client preflight
  exposeHeadersSet.add('access-control-allow-headers')
  if (options.sendSelfEndpoint) exposeHeadersSet.add('i-am')

  // Needed for basic operation: https://github.com/transloadit/uppy/issues/3021
  const allowedHeaders = [
    'uppy-auth-token',
    'uppy-versions',
    'uppy-credentials-params',
    'authorization',
    'origin',
    'content-type',
    'accept',
  ]
  const existingAllowHeaders = res.get('Access-Control-Allow-Headers')
  const allowHeadersSet = new Set(existingAllowHeaders
    ? existingAllowHeaders
      .split(',')
      .map((method) => method.trim().toLowerCase())
      .concat(allowedHeaders)
    : allowedHeaders)

  const existingAllowMethods = res.get('Access-Control-Allow-Methods')
  const allowMethodsSet = new Set(existingAllowMethods && existingAllowMethods.split(',').map(method => method.trim().toUpperCase()))
  // Needed for basic operation:
  allowMethodsSet.add('GET').add('POST').add('OPTIONS').add('DELETE')

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
    methods: Array.from(allowMethodsSet),
    allowedHeaders: Array.from(allowHeadersSet).join(','),
    exposedHeaders: Array.from(exposeHeadersSet).join(','),
  })(req, res, next)
}

exports.metrics = () => {
  const metricsMiddleware = promBundle({ includeMethod: true })
  // @ts-ignore Not in the typings, but it does exist
  const { promClient } = metricsMiddleware
  const { collectDefaultMetrics } = promClient
  collectDefaultMetrics({ register: promClient.register })

  // Add version as a prometheus gauge
  const versionGauge = new promClient.Gauge({ name: 'companion_version', help: 'npm version as an integer' })
  // @ts-ignore
  const numberVersion = Number(version.replace(/\D/g, ''))
  versionGauge.set(numberVersion)
  return metricsMiddleware
}
