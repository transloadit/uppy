const express = require('express')
const Grant = require('grant').express()
const merge = require('lodash.merge')
const cookieParser = require('cookie-parser')
const interceptor = require('express-interceptor')
const { randomUUID } = require('node:crypto')

const grantConfig = require('./config/grant')()
const providerManager = require('./server/provider')
const controllers = require('./server/controllers')
const s3 = require('./server/controllers/s3')
const url = require('./server/controllers/url')
const createEmitter = require('./server/emitter')
const redis = require('./server/redis')
const jobs = require('./server/jobs')
const logger = require('./server/logger')
const middlewares = require('./server/middlewares')
const { getMaskableSecrets, defaultOptions, validateConfig } = require('./config/companion')
const { ProviderApiError, ProviderAuthError } = require('./server/provider/error')
const { getCredentialsOverrideMiddleware } = require('./server/provider/credentials')
// @ts-ignore
const { version } = require('../package.json')

// intercepts grantJS' default response error when something goes
// wrong during oauth process.
const interceptGrantErrorResponse = interceptor((req, res) => {
  return {
    isInterceptable: () => {
      // match grant.js' callback url
      return /^\/connect\/\w+\/callback/.test(req.path)
    },
    intercept: (body, send) => {
      const unwantedBody = 'error=Grant%3A%20missing%20session%20or%20misconfigured%20provider'
      if (body === unwantedBody) {
        logger.error(`grant.js responded with error: ${body}`, 'grant.oauth.error', req.id)
        res.set('Content-Type', 'text/plain')
        const reqHint = req.id ? `Request ID: ${req.id}` : ''
        send([
          'Companion was unable to complete the OAuth process :(',
          'Error: User session is missing or the Provider was misconfigured',
          reqHint,
        ].join('\n'))
      } else {
        send(body)
      }
    },
  }
})

// make the errors available publicly for custom providers
module.exports.errors = { ProviderApiError, ProviderAuthError }
module.exports.socket = require('./server/socket')

/**
 * Entry point into initializing the Companion app.
 *
 * @param {object} optionsArg
 * @returns {{ app: import('express').Express, emitter: any }}}
 */
module.exports.app = (optionsArg = {}) => {
  validateConfig(optionsArg)

  const options = merge({}, defaultOptions, optionsArg)

  const providers = providerManager.getDefaultProviders()
  const searchProviders = providerManager.getSearchProviders()
  providerManager.addProviderOptions(options, grantConfig)

  const { customProviders } = options
  if (customProviders) {
    providerManager.addCustomProviders(customProviders, providers, grantConfig)
  }

  // mask provider secrets from log messages
  logger.setMaskables(getMaskableSecrets(options))

  // create singleton redis client
  if (options.redisUrl) {
    redis.client(options)
  }
  const emitter = createEmitter(options.redisUrl, options.redisPubSubScope)

  const app = express()

  if (options.metrics) {
    app.use(middlewares.metrics({ path: options.server.path }))
  }

  app.use(cookieParser()) // server tokens are added to cookies

  app.use(interceptGrantErrorResponse)
  // override provider credentials at request time
  app.use('/connect/:authProvider/:override?', getCredentialsOverrideMiddleware(providers, options))
  app.use(Grant(grantConfig))

  app.use((req, res, next) => {
    if (options.sendSelfEndpoint) {
      const { protocol } = options.server
      res.header('i-am', `${protocol}://${options.sendSelfEndpoint}`)
    }
    next()
  })

  app.use(middlewares.cors(options))

  // add uppy options to the request object so it can be accessed by subsequent handlers.
  app.use('*', middlewares.getCompanionMiddleware(options))
  app.use('/s3', s3(options.s3))
  app.use('/url', url())

  app.post('/:providerName/preauth', middlewares.hasSessionAndProvider, controllers.preauth)
  app.get('/:providerName/connect', middlewares.hasSessionAndProvider, controllers.connect)
  app.get('/:providerName/redirect', middlewares.hasSessionAndProvider, controllers.redirect)
  app.get('/:providerName/callback', middlewares.hasSessionAndProvider, controllers.callback)
  app.post('/:providerName/deauthorization/callback', middlewares.hasSessionAndProvider, controllers.deauthorizationCallback)
  app.get('/:providerName/logout', middlewares.hasSessionAndProvider, middlewares.gentleVerifyToken, controllers.logout)
  app.get('/:providerName/send-token', middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.sendToken)
  app.get('/:providerName/list/:id?', middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.list)
  app.post('/:providerName/get/:id', middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.get)
  app.get('/:providerName/thumbnail/:id', middlewares.hasSessionAndProvider, middlewares.cookieAuthToken, middlewares.verifyToken, controllers.thumbnail)
  // @ts-ignore Type instantiation is excessively deep and possibly infinite.
  app.get('/search/:searchProviderName/list', middlewares.hasSearchQuery, middlewares.loadSearchProviderToken, controllers.list)
  app.post('/search/:searchProviderName/get/:id', middlewares.loadSearchProviderToken, controllers.get)

  app.param('providerName', providerManager.getProviderMiddleware(providers, true))
  app.param('searchProviderName', providerManager.getProviderMiddleware(searchProviders))

  if (app.get('env') !== 'test') {
    jobs.startCleanUpJob(options.filePath)
  }

  const processId = randomUUID()

  jobs.startPeriodicPingJob({
    urls: options.periodicPingUrls,
    interval: options.periodicPingInterval,
    count: options.periodicPingCount,
    staticPayload: options.periodicPingStaticPayload,
    version,
    processId,
  })

  return { app, emitter }
}
