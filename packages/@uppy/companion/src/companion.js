const express = require('express')
const Grant = require('grant').default.express()
const merge = require('lodash/merge')
const cookieParser = require('cookie-parser')
const interceptor = require('express-interceptor')
const { randomUUID } = require('node:crypto')

const grantConfig = require('./config/grant')()
const providerManager = require('./server/provider')
const controllers = require('./server/controllers')
const s3 = require('./server/controllers/s3')
const url = require('./server/controllers/url')
const googlePicker = require('./server/controllers/googlePicker')
const createEmitter = require('./server/emitter')
const redis = require('./server/redis')
const jobs = require('./server/jobs')
const logger = require('./server/logger')
const middlewares = require('./server/middlewares')
const { getMaskableSecrets, defaultOptions, validateConfig } = require('./config/companion')
const { ProviderApiError, ProviderUserError, ProviderAuthError } = require('./server/provider/error')
const { getCredentialsOverrideMiddleware } = require('./server/provider/credentials')
const { getURLBuilder } = require('./server/helpers/utils')
// @ts-ignore
const { version } = require('../package.json')
const { isOAuthProvider } = require('./server/provider/Provider')


function setLoggerProcessName({ loggerProcessName }) {
  if (loggerProcessName != null) logger.setProcessName(loggerProcessName)
}

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
module.exports.errors = { ProviderApiError, ProviderUserError, ProviderAuthError }
module.exports.socket = require('./server/socket')

module.exports.setLoggerProcessName = setLoggerProcessName

/**
 * Entry point into initializing the Companion app.
 *
 * @param {object} optionsArg
 * @returns {{ app: import('express').Express, emitter: any }}}
 */
module.exports.app = (optionsArg = {}) => {
  setLoggerProcessName(optionsArg)

  validateConfig(optionsArg)

  const options = merge({}, defaultOptions, optionsArg)

  const providers = providerManager.getDefaultProviders()

  const { customProviders } = options
  if (customProviders) {
    providerManager.addCustomProviders(customProviders, providers, grantConfig)
  }

  const getOauthProvider = (providerName) => providers[providerName]?.oauthProvider

  providerManager.addProviderOptions(options, grantConfig, getOauthProvider)

  // mask provider secrets from log messages
  logger.setMaskables(getMaskableSecrets(options))

  // create singleton redis client if corresponding options are set
  const redisClient = redis.client(options)
  const emitter = createEmitter(redisClient, options.redisPubSubScope)

  const app = express()

  if (options.metrics) {
    app.use(middlewares.metrics({ path: options.server.path }))
  }

  app.use(cookieParser()) // server tokens are added to cookies

  app.use(interceptGrantErrorResponse)

  // override provider credentials at request time
  // Making `POST` request to the `/connect/:provider/:override?` route requires a form body parser middleware:
  // See https://github.com/simov/grant#dynamic-http
  app.use('/connect/:oauthProvider/:override?', express.urlencoded({ extended: false }), getCredentialsOverrideMiddleware(providers, options))
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
  if (options.enableUrlEndpoint) app.use('/url', url())
  if (options.enableGooglePickerEndpoint) app.use('/google-picker', googlePicker())

  app.post('/:providerName/preauth', express.json(), express.urlencoded({ extended: false }), middlewares.hasSessionAndProvider, middlewares.hasBody, middlewares.hasOAuthProvider, controllers.preauth)
  app.get('/:providerName/connect', middlewares.hasSessionAndProvider, middlewares.hasOAuthProvider, controllers.connect)
  app.get('/:providerName/redirect', middlewares.hasSessionAndProvider, middlewares.hasOAuthProvider, controllers.redirect)
  app.get('/:providerName/callback', middlewares.hasSessionAndProvider, middlewares.hasOAuthProvider, controllers.callback)
  app.post('/:providerName/refresh-token', middlewares.hasSessionAndProvider, middlewares.hasOAuthProvider, middlewares.verifyToken, controllers.refreshToken)
  app.post('/:providerName/deauthorization/callback', express.json(), middlewares.hasSessionAndProvider, middlewares.hasBody, middlewares.hasOAuthProvider, controllers.deauthorizationCallback)
  app.get('/:providerName/logout', middlewares.hasSessionAndProvider, middlewares.hasOAuthProvider, middlewares.gentleVerifyToken, controllers.logout)
  app.get('/:providerName/send-token', middlewares.hasSessionAndProvider, middlewares.hasOAuthProvider, middlewares.verifyToken, controllers.sendToken)

  app.post('/:providerName/simple-auth', express.json(), middlewares.hasSessionAndProvider, middlewares.hasBody, middlewares.hasSimpleAuthProvider, controllers.simpleAuth)

  app.get('/:providerName/list/:id?', middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.list)
  // backwards compat:
  app.get('/search/:providerName/list', middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.list)

  app.post('/:providerName/get/:id', express.json(), middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.get)
  // backwards compat:
  app.post('/search/:providerName/get/:id', express.json(), middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.get)

  app.get('/:providerName/thumbnail/:id', middlewares.hasSessionAndProvider, middlewares.hasOAuthProvider, middlewares.cookieAuthToken, middlewares.verifyToken, controllers.thumbnail)

  // Used for testing dynamic credentials only, normally this would run on a separate server.
  if (options.testDynamicOauthCredentials) {
    app.post('/:providerName/test-dynamic-oauth-credentials', (req, res) => {
      if (req.query.secret !== options.testDynamicOauthCredentialsSecret) throw new Error('Invalid secret')
      const { providerName } = req.params
      // for simplicity, we just return the normal credentials for the provider, but in a real-world scenario,
      // we would query based on parameters
      const { key, secret } = options.providerOptions[providerName] ?? { __proto__: null }

      function getTransloaditGateway() {
        const oauthProvider = getOauthProvider(providerName)
        if (!isOAuthProvider(oauthProvider)) return undefined
        return getURLBuilder(options)('', true)
      }

      const response = {
        credentials: {
          key,
          secret,
          transloadit_gateway: getTransloaditGateway(),
          origins: ['http://localhost:5173'],
        },
      }

      logger.info(`Returning dynamic OAuth2 credentials for ${providerName}`, JSON.stringify(response))

      res.send(response)
    })
  }

  app.param('providerName', providerManager.getProviderMiddleware(providers, grantConfig))

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
