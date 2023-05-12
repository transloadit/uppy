const cors = require('cors')
const promBundle = require('express-prom-bundle')

// @ts-ignore
const { version } = require('../../package.json')
const tokenService = require('./helpers/jwt')
const logger = require('./logger')
const getS3Client = require('./s3-client')
const { getURLBuilder } = require('./helpers/utils')
const { isOAuthProvider } = require('./provider/Provider')

exports.hasSessionAndProvider = (req, res, next) => {
  if (!req.session) {
    logger.debug('No session attached to req object. Exiting dispatcher.', null, req.id)
    return res.sendStatus(400)
  }

  if (!req.companion.provider) {
    logger.debug('No provider/provider-handler found. Exiting dispatcher.', null, req.id)
    return res.sendStatus(400)
  }

  return next()
}

const isOAuthProviderReq = (req) => isOAuthProvider(req.companion.providerClass.authProvider)

/**
 * Middleware can be used to verify that the current request is to an OAuth provider
 * This is because not all requests are supported by non-oauth providers (formerly known as SearchProviders)
 */
exports.hasOAuthProvider = (req, res, next) => {
  if (!isOAuthProviderReq(req)) {
    logger.debug('Provider does not support OAuth.', null, req.id)
    return res.sendStatus(400)
  }

  return next()
}

exports.hasBody = (req, res, next) => {
  if (!req.body) {
    logger.debug('No body attached to req object. Exiting dispatcher.', null, req.id)
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
  // for non oauth providers, we just load the static key from options
  if (!isOAuthProviderReq(req)) {
    const { providerOptions } = req.companion.options
    const { providerName } = req.params
    if (!providerOptions[providerName] || !providerOptions[providerName].key) {
      logger.info(`unconfigured credentials for ${providerName}`, 'non.oauth.token.load.unset', req.id)
      res.sendStatus(501)
      return
    }

    req.companion.providerTokens = {
      accessToken: providerOptions[providerName].key,
    }
    next()
    return
  }

  // Ok, OAuth provider, we fetch the token:
  const token = req.companion.authToken
  if (token == null) {
    logger.info('cannot auth token', 'token.verify.unset', req.id)
    res.sendStatus(401)
    return
  }
  const { providerName } = req.params
  try {
    const payload = tokenService.verifyEncryptedAuthToken(token, req.companion.options.secret, providerName)
    req.companion.allProvidersTokens = payload
    req.companion.providerTokens = payload[providerName]
  } catch (err) {
    logger.error(err.message, 'token.verify.error', req.id)
    res.sendStatus(401)
    return
  }
  next()
}

// does not fail if token is invalid
exports.gentleVerifyToken = (req, res, next) => {
  const { providerName } = req.params
  if (req.companion.authToken) {
    try {
      const payload = tokenService.verifyEncryptedAuthToken(
        req.companion.authToken, req.companion.options.secret, providerName,
      )
      req.companion.allProvidersTokens = payload
    } catch (err) {
      logger.error(err.message, 'token.gentle.verify.error', req.id)
    }
  }
  next()
}

exports.cookieAuthToken = (req, res, next) => {
  req.companion.authToken = req.cookies[`uppyAuthToken--${req.companion.provider.authProvider}`]
  return next()
}

exports.cors = (options = {}) => (req, res, next) => {
  // HTTP headers are not case sensitive, and express always handles them in lower case, so that's why we lower case them.
  // I believe that HTTP verbs are case sensitive, and should be uppercase.

  const existingExposeHeaders = res.get('Access-Control-Expose-Headers')
  const exposeHeadersSet = new Set(existingExposeHeaders?.split(',')?.map((method) => method.trim().toLowerCase()))

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
  const allowMethodsSet = new Set(existingAllowMethods?.split(',')?.map((method) => method.trim().toUpperCase()))
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

exports.metrics = ({ path = undefined } = {}) => {
  const metricsMiddleware = promBundle({ includeMethod: true, metricsPath: path ? `${path}/metrics` : undefined })
  // @ts-ignore Not in the typings, but it does exist
  const { promClient } = metricsMiddleware
  const { collectDefaultMetrics } = promClient
  collectDefaultMetrics({ register: promClient.register })

  // Add version as a prometheus gauge
  const versionGauge = new promClient.Gauge({ name: 'companion_version', help: 'npm version as an integer' })
  const numberVersion = Number(version.replace(/\D/g, ''))
  versionGauge.set(numberVersion)
  return metricsMiddleware
}

/**
 *
 * @param {object} options
 */
exports.getCompanionMiddleware = (options) => {
  /**
   * @param {object} req
   * @param {object} res
   * @param {Function} next
   */
  const middleware = (req, res, next) => {
    const versionFromQuery = req.query.uppyVersions ? decodeURIComponent(req.query.uppyVersions) : null
    req.companion = {
      options,
      s3Client: getS3Client(options),
      authToken: req.header('uppy-auth-token') || req.query.uppyAuthToken,
      clientVersion: req.header('uppy-versions') || versionFromQuery || '1.0.0',
      buildURL: getURLBuilder(options),
    }

    if (options.logClientVersion) {
      logger.info(`uppy client version ${req.companion.clientVersion}`, 'companion.client.version')
    }
    next()
  }

  return middleware
}
