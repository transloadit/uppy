import { randomUUID } from 'node:crypto'
import cookieParser from 'cookie-parser'
import type { Express } from 'express'
import express from 'express'
import interceptor from 'express-interceptor'
import grant from 'grant'
import merge from 'lodash/merge.js'
import packageJson from '../package.json' with { type: 'json' }
import {
  defaultOptions,
  getMaskableSecrets,
  validateConfig,
} from './config/companion.js'
import grantConfigFn from './config/grant.js'
import type { CompanionInitOptionsInput } from './schemas/index.js'
import googlePicker from './server/controllers/googlePicker.js'
import * as controllers from './server/controllers/index.js'
import s3 from './server/controllers/s3.js'
import searchController from './server/controllers/search.js'
import url from './server/controllers/url.js'
import createEmitter from './server/emitter/index.js'
import { getURLBuilder } from './server/helpers/utils.js'
import * as jobs from './server/jobs.js'
import logger from './server/logger.js'
import * as middlewares from './server/middlewares.js'
import { getCredentialsOverrideMiddleware } from './server/provider/credentials.js'
import {
  ProviderApiError,
  ProviderAuthError,
  ProviderUserError,
} from './server/provider/error.js'
import * as providerManager from './server/provider/index.js'
import { isOAuthProvider } from './server/provider/Provider.js'
import * as redis from './server/redis.js'

import socket from './server/socket.js'

export { socket }

const grantConfig = grantConfigFn()

export function setLoggerProcessName(
  options: { loggerProcessName?: unknown } = {},
) {
  const { loggerProcessName } = options
  if (typeof loggerProcessName === 'string' && loggerProcessName.length > 0) {
    logger.setProcessName(loggerProcessName)
  }
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
      const unwantedBody =
        'error=Grant%3A%20missing%20session%20or%20misconfigured%20provider'
      if (body === unwantedBody) {
        logger.error(
          `grant.js responded with error: ${body}`,
          'grant.oauth.error',
          req.id,
        )
        res.set('Content-Type', 'text/plain')
        const reqHint = req.id ? `Request ID: ${req.id}` : ''
        send(
          [
            'Companion was unable to complete the OAuth process :(',
            'Error: User session is missing or the Provider was misconfigured',
            reqHint,
          ].join('\n'),
        )
      } else {
        send(body)
      }
    },
  }
})

// make the errors available publicly for custom providers
export const errors = {
  ProviderApiError,
  ProviderUserError,
  ProviderAuthError,
}

/**
 * Entry point into initializing the Companion app.
 */
export function app(optionsArg: CompanionInitOptionsInput = {}): {
  app: Express
  emitter: unknown
} {
  setLoggerProcessName(optionsArg)

  validateConfig(optionsArg)

  const options = merge({}, defaultOptions, optionsArg)

  const providers = providerManager.getDefaultProviders()

  type CustomProviders = Parameters<
    typeof providerManager.addCustomProviders
  >[0]
  const customProviders = options.customProviders as CustomProviders | undefined
  if (customProviders) {
    providerManager.addCustomProviders(customProviders, providers, grantConfig)
  }

  const getOauthProvider = (providerName) =>
    providers[providerName]?.oauthProvider

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
  app.use(
    '/connect/:oauthProvider/:override?',
    express.urlencoded({ extended: false }),
    getCredentialsOverrideMiddleware(providers, options),
  )
  app.use(grant.default.express(grantConfig))

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
  if (options.enableGooglePickerEndpoint)
    app.use('/google-picker', googlePicker())

  app.post(
    '/:providerName/preauth',
    express.json(),
    express.urlencoded({ extended: false }),
    middlewares.hasSessionAndProvider,
    middlewares.hasBody,
    middlewares.hasOAuthProvider,
    controllers.preauth,
  )
  app.get(
    '/:providerName/connect',
    middlewares.hasSessionAndProvider,
    middlewares.hasOAuthProvider,
    controllers.connect,
  )
  app.get(
    '/:providerName/redirect',
    middlewares.hasSessionAndProvider,
    middlewares.hasOAuthProvider,
    controllers.redirect,
  )
  app.get(
    '/:providerName/callback',
    middlewares.hasSessionAndProvider,
    middlewares.hasOAuthProvider,
    controllers.callback,
  )
  app.post(
    '/:providerName/refresh-token',
    middlewares.hasSessionAndProvider,
    middlewares.hasOAuthProvider,
    middlewares.verifyToken,
    controllers.refreshToken,
  )
  app.post(
    '/:providerName/deauthorization/callback',
    express.json(),
    middlewares.hasSessionAndProvider,
    middlewares.hasBody,
    middlewares.hasOAuthProvider,
    controllers.deauthorizationCallback,
  )
  app.get(
    '/:providerName/logout',
    middlewares.hasSessionAndProvider,
    middlewares.hasOAuthProvider,
    middlewares.gentleVerifyToken,
    controllers.logout,
  )
  app.get(
    '/:providerName/send-token',
    middlewares.hasSessionAndProvider,
    middlewares.hasOAuthProvider,
    middlewares.verifyToken,
    controllers.sendToken,
  )

  app.post(
    '/:providerName/simple-auth',
    express.json(),
    middlewares.hasSessionAndProvider,
    middlewares.hasBody,
    middlewares.hasSimpleAuthProvider,
    controllers.simpleAuth,
  )

  app.get(
    '/:providerName/list/:id?',
    middlewares.hasSessionAndProvider,
    middlewares.verifyToken,
    controllers.list,
  )
  app.get(
    '/:providerName/search',
    middlewares.hasSessionAndProvider,
    middlewares.verifyToken,
    searchController,
  )
  // backwards compat:
  app.get(
    '/search/:providerName/list',
    middlewares.hasSessionAndProvider,
    middlewares.verifyToken,
    controllers.list,
  )

  app.post(
    '/:providerName/get/:id',
    express.json(),
    middlewares.hasSessionAndProvider,
    middlewares.verifyToken,
    controllers.get,
  )
  // backwards compat:
  app.post(
    '/search/:providerName/get/:id',
    express.json(),
    middlewares.hasSessionAndProvider,
    middlewares.verifyToken,
    controllers.get,
  )

  app.get(
    '/:providerName/thumbnail/:id',
    middlewares.hasSessionAndProvider,
    middlewares.hasOAuthProvider,
    middlewares.cookieAuthToken,
    middlewares.verifyToken,
    controllers.thumbnail,
  )

  // Used for testing dynamic credentials only, normally this would run on a separate server.
  if (options.testDynamicOauthCredentials) {
    app.post('/:providerName/test-dynamic-oauth-credentials', (req, res) => {
      if (req.query.secret !== options.testDynamicOauthCredentialsSecret)
        throw new Error('Invalid secret')
      const { providerName } = req.params
      // for simplicity, we just return the normal credentials for the provider, but in a real-world scenario,
      // we would query based on parameters
      const { key, secret } = options.providerOptions[providerName] ?? {
        __proto__: null,
      }

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

      logger.info(
        `Returning dynamic OAuth2 credentials for ${providerName}`,
        JSON.stringify(response),
      )

      res.send(response)
    })
  }

  app.param(
    'providerName',
    providerManager.getProviderMiddleware(providers, grantConfig),
  )

  if (app.get('env') !== 'test') {
    jobs.startCleanUpJob(`${options.filePath}`)
  }

  const processId = randomUUID()

  jobs.startPeriodicPingJob({
    urls: options.periodicPingUrls ?? [],
    interval: options.periodicPingInterval,
    count: options.periodicPingCount,
    staticPayload: options.periodicPingStaticPayload,
    version: packageJson.version,
    processId,
  })

  return { app, emitter }
}
