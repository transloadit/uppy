const express = require('express')
// @ts-ignore
const Grant = require('grant').express()
const grantConfig = require('./config/grant')()
const providerManager = require('./server/provider')
const controllers = require('./server/controllers')
const s3 = require('./server/controllers/s3')
const url = require('./server/controllers/url')
const SocketServer = require('ws').Server
const emitter = require('./server/emitter')
const merge = require('lodash.merge')
const redis = require('./server/redis')
const cookieParser = require('cookie-parser')
const { jsonStringify, getURLBuilder } = require('./server/helpers/utils')
const jobs = require('./server/jobs')
const interceptor = require('express-interceptor')
const logger = require('./server/logger')
const { STORAGE_PREFIX } = require('./server/Uploader')
const middlewares = require('./server/middlewares')
const { shortenToken } = require('./server/Uploader')
const { ProviderApiError, ProviderAuthError } = require('./server/provider/error')
const ms = require('ms')

const defaultOptions = {
  server: {
    protocol: 'http',
    path: ''
  },
  providerOptions: {
    s3: {
      acl: 'public-read',
      endpoint: 'https://{service}.{region}.amazonaws.com',
      conditions: [],
      useAccelerateEndpoint: false,
      getKey: (req, filename) => filename,
      expires: ms('5 minutes') / 1000
    }
  },
  debug: true
}

// make the errors available publicly for custom providers
module.exports.errors = { ProviderApiError, ProviderAuthError }

/**
 * Entry point into initializing the Companion app.
 *
 * @param {object} options
 */
module.exports.app = (options = {}) => {
  options = merge({}, defaultOptions, options)
  const providers = providerManager.getDefaultProviders(options)
  providerManager.addProviderOptions(options, grantConfig)

  const customProviders = options.customProviders
  if (customProviders) {
    providerManager.addCustomProviders(customProviders, providers, grantConfig)
  }

  // create singleton redis client
  if (options.redisUrl) {
    redis.client(merge({ url: options.redisUrl }, options.redisOptions || {}))
  }
  emitter(options.multipleInstances && options.redisUrl)

  const app = express()
  app.use(cookieParser()) // server tokens are added to cookies

  app.use(interceptGrantErrorResponse)
  app.use(Grant(grantConfig))
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
    res.header(
      'Access-Control-Allow-Headers',
      [
        'uppy-auth-token',
        'uppy-versions',
        res.get('Access-Control-Allow-Headers')
      ].join(',')
    )

    const exposedHeaders = [
      // exposed so it can be accessed for our custom uppy preflight
      'Access-Control-Allow-Headers'
    ]

    if (options.sendSelfEndpoint) {
      // add it to the exposed headers.
      exposedHeaders.push('i-am')

      const { protocol } = options.server
      res.header('i-am', `${protocol}://${options.sendSelfEndpoint}`)
    }

    if (res.get('Access-Control-Expose-Headers')) {
      // if the header had been previously set, the values should be added too
      exposedHeaders.push(res.get('Access-Control-Expose-Headers'))
    }

    res.header('Access-Control-Expose-Headers', exposedHeaders.join(','))
    next()
  })

  // add uppy options to the request object so it can be accessed by subsequent handlers.
  app.use('*', getOptionsMiddleware(options))
  app.use('/s3', s3(options.providerOptions.s3))
  app.use('/url', url())

  app.get('/:providerName/callback', middlewares.hasSessionAndProvider, controllers.callback)
  app.get('/:providerName/connect', middlewares.hasSessionAndProvider, controllers.connect)
  app.get('/:providerName/redirect', middlewares.hasSessionAndProvider, controllers.redirect)
  app.get('/:providerName/logout', middlewares.hasSessionAndProvider, middlewares.gentleVerifyToken, controllers.logout)
  app.get('/:providerName/send-token', middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.sendToken)
  app.get('/:providerName/list/:id?', middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.list)
  app.post('/:providerName/get/:id', middlewares.hasSessionAndProvider, middlewares.verifyToken, controllers.get)
  app.get('/:providerName/thumbnail/:id', middlewares.hasSessionAndProvider, middlewares.cookieAuthToken, middlewares.verifyToken, controllers.thumbnail)

  app.param('providerName', providerManager.getProviderMiddleware(providers))

  if (app.get('env') !== 'test') {
    jobs.startCleanUpJob(options.filePath)
  }

  return app
}

/**
 * the socket is used to send progress events during an upload
 *
 * @param {object} server
 */
module.exports.socket = (server) => {
  const wss = new SocketServer({ server })
  const redisClient = redis.client()

  // A new connection is usually created when an upload begins,
  // or when connection fails while an upload is on-going and,
  // client attempts to reconnect.
  wss.on('connection', (ws, req) => {
    // @ts-ignore
    const fullPath = req.url
    // the token identifies which ongoing upload's progress, the socket
    // connection wishes to listen to.
    const token = fullPath.replace(/^.*\/api\//, '')
    logger.info(`connection received from ${token}`, 'socket.connect')

    /**
     *
     * @param {{action: string, payload: object}} data
     */
    function sendProgress (data) {
      ws.send(jsonStringify(data), (err) => {
        if (err) logger.error(err, 'socket.progress.error', shortenToken(token))
      })
    }

    // if the redisClient is available, then we attempt to check the storage
    // if we have any already stored progress data on the upload.
    if (redisClient) {
      redisClient.get(`${STORAGE_PREFIX}:${token}`, (err, data) => {
        if (err) logger.error(err, 'socket.redis.error', shortenToken(token))
        if (data) {
          const dataObj = JSON.parse(data.toString())
          if (dataObj.action) sendProgress(dataObj)
        }
      })
    }

    emitter().emit(`connection:${token}`)
    emitter().on(token, sendProgress)

    ws.on('message', (jsonData) => {
      const data = JSON.parse(jsonData.toString())
      // whitelist triggered actions
      if (['pause', 'resume', 'cancel'].includes(data.action)) {
        emitter().emit(`${data.action}:${token}`)
      }
    })

    ws.on('close', () => {
      emitter().removeListener(token, sendProgress)
    })
  })
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
          reqHint
        ].join('\n'))
      } else {
        send(body)
      }
    }
  }
})

/**
 *
 * @param {object} options
 */
const getOptionsMiddleware = (options) => {
  let s3Client = null
  if (options.providerOptions.s3) {
    const S3 = require('aws-sdk/clients/s3')
    const AWS = require('aws-sdk')
    const s3ProviderOptions = options.providerOptions.s3

    if (s3ProviderOptions.accessKeyId || s3ProviderOptions.secretAccessKey) {
      throw new Error('Found `providerOptions.s3.accessKeyId` or `providerOptions.s3.secretAccessKey` configuration, but Companion requires `key` and `secret` option names instead. Please use the `key` property instead of `accessKeyId` and the `secret` property instead of `secretAccessKey`.')
    }

    const rawClientOptions = s3ProviderOptions.awsClientOptions
    if (rawClientOptions && (rawClientOptions.accessKeyId || rawClientOptions.secretAccessKey)) {
      throw new Error('Found unsupported `providerOptions.s3.awsClientOptions.accessKeyId` or `providerOptions.s3.awsClientOptions.secretAccessKey` configuration. Please use the `providerOptions.s3.key` and `providerOptions.s3.secret` options instead.')
    }

    const s3ClientOptions = Object.assign({
      signatureVersion: 'v4',
      // backwards compat
      useAccelerateEndpoint: s3ProviderOptions.useAccelerateEndpoint
    }, rawClientOptions)

    // Use credentials to allow assumed roles to pass STS sessions in.
    // If the user doesn't specify key and secret, the default credentials (process-env)
    // will be used by S3 in calls below.
    if (s3ProviderOptions.key && s3ProviderOptions.secret && !s3ClientOptions.credentials) {
      s3ClientOptions.credentials = new AWS.Credentials(
        s3ProviderOptions.key,
        s3ProviderOptions.secret,
        s3ProviderOptions.sessionToken)
    }
    s3Client = new S3(s3ClientOptions)
  }

  /**
   * @param {object} req
   * @param {object} res
   * @param {function} next
   */
  const middleware = (req, res, next) => {
    const versionFromQuery = req.query.uppyVersions ? decodeURIComponent(req.query.uppyVersions) : null
    req.companion = {
      options,
      s3Client,
      authToken: req.header('uppy-auth-token') || req.query.uppyAuthToken,
      clientVersion: req.header('uppy-versions') || versionFromQuery || '1.0.0',
      buildURL: getURLBuilder(options)
    }

    logger.info(`uppy client version ${req.companion.clientVersion}`, 'companion.client.version')
    // @todo remove req.uppy in next major release
    req.uppy = req.companion
    next()
  }

  return middleware
}
