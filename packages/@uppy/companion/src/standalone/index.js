const express = require('express')
const qs = require('querystring')
const helmet = require('helmet')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const { URL } = require('url')
const merge = require('lodash/merge')
const session = require('express-session')
const addRequestId = require('express-request-id')()
const logger = require('../server/logger')
const redis = require('../server/redis')
const companion = require('../companion')
const helper = require('./helper')
const middlewares = require('../server/middlewares')

/**
 * Configures an Express app for running Companion standalone
 *
 * @returns {object}
 */
function server (inputCompanionOptions = {}) {
  const app = express()

  // Query string keys whose values should not end up in logging output.
  const sensitiveKeys = new Set(['access_token', 'uppyAuthToken'])

  /**
   * Obscure the contents of query string keys listed in `sensitiveKeys`.
   *
   * Returns a copy of the object with unknown types removed and sensitive values replaced by ***.
   *
   * The input type is more broad that it needs to be, this way typescript can help us guarantee that we're dealing with all possible inputs :)
   *
   * @param {{ [key: string]: any }} rawQuery
   * @returns {{
   *   query: { [key: string]: string },
   *   censored: boolean
   * }}
   */
  function censorQuery (rawQuery) {
    /** @type {{ [key: string]: string }} */
    const query = {}
    let censored = false
    Object.keys(rawQuery).forEach((key) => {
      if (typeof rawQuery[key] !== 'string') {
        return
      }
      if (sensitiveKeys.has(key)) {
        // replace logged access token
        query[key] = '********'
        censored = true
      } else {
        query[key] = rawQuery[key]
      }
    })
    return { query, censored }
  }

  app.use(addRequestId)
  // log server requests.
  app.use(morgan('combined'))
  morgan.token('url', (req, res) => {
    const { query, censored } = censorQuery(req.query)
    return censored ? `${req.path}?${qs.stringify(query)}` : req.originalUrl || req.url
  })

  morgan.token('referrer', (req, res) => {
    const ref = req.headers.referer || req.headers.referrer
    if (typeof ref === 'string') {
      const parsed = new URL(ref)
      const rawQuery = qs.parse(parsed.search.replace('?', ''))
      const { query, censored } = censorQuery(rawQuery)
      return censored ? `${parsed.href.split('?')[0]}?${qs.stringify(query)}` : parsed.href
    }
  })

  // for server metrics tracking.
  // make app metrics available at '/metrics'.
  // TODO for the next major version: use instead companion option "metrics": true and remove this code
  // Se discussion: https://github.com/transloadit/uppy/pull/2854/files/64be97205e4012818abfcc8b0b8b7fe09de91729#diff-68f5e3eb307c1c9d1fd02224fd7888e2f74718744e1b6e35d929fcab1cc50ed1
  if (process.env.COMPANION_HIDE_METRICS !== 'true') {
    app.use(middlewares.metrics())
  }

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))

  // Use helmet to secure Express headers
  app.use(helmet.frameguard())
  app.use(helmet.xssFilter())
  app.use(helmet.noSniff())
  app.use(helmet.ieNoOpen())
  app.disable('x-powered-by')

  let corsOrigins
  if (process.env.COMPANION_CLIENT_ORIGINS) {
    corsOrigins = process.env.COMPANION_CLIENT_ORIGINS
      .split(',')
      .map((url) => (helper.hasProtocol(url) ? url : `${process.env.COMPANION_PROTOCOL || 'http'}://${url}`))
  } else if (process.env.COMPANION_CLIENT_ORIGINS_REGEX) {
    corsOrigins = new RegExp(process.env.COMPANION_CLIENT_ORIGINS_REGEX)
  }

  const moreCompanionOptions = { ...inputCompanionOptions, corsOrigins }
  const companionOptions = helper.getCompanionOptions(moreCompanionOptions)
  const sessionOptions = {
    secret: companionOptions.secret,
    resave: true,
    saveUninitialized: true,
  }

  if (companionOptions.redisUrl) {
    const RedisStore = require('connect-redis')(session)
    const redisClient = redis.client(
      merge({ url: companionOptions.redisUrl }, companionOptions.redisOptions)
    )
    sessionOptions.store = new RedisStore({ client: redisClient })
  }

  if (process.env.COMPANION_COOKIE_DOMAIN) {
    sessionOptions.cookie = {
      domain: process.env.COMPANION_COOKIE_DOMAIN,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  }

  app.use(session(sessionOptions))

  app.use((req, res, next) => {
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Origin, Content-Type, Accept'
    )
    next()
  })

  // Routes
  if (process.env.COMPANION_HIDE_WELCOME !== 'true') {
    app.get('/', (req, res) => {
      res.setHeader('Content-Type', 'text/plain')
      res.send(helper.buildHelpfulStartupMessage(companionOptions))
    })
  }

  let companionApp
  try {
    // initialize companion
    companionApp = companion.app(companionOptions)
  } catch (error) {
    console.error('\x1b[31m', error.message, '\x1b[0m')
    process.exit(1)
  }

  // add companion to server middleware
  if (process.env.COMPANION_PATH) {
    app.use(process.env.COMPANION_PATH, companionApp)
  } else {
    app.use(companionApp)
  }

  // WARNING: This route is added in order to validate your app with OneDrive.
  // Only set COMPANION_ONEDRIVE_DOMAIN_VALIDATION if you are sure that you are setting the
  // correct value for COMPANION_ONEDRIVE_KEY (i.e application ID). If there's a slightest possiblilty
  // that you might have mixed the values for COMPANION_ONEDRIVE_KEY and COMPANION_ONEDRIVE_SECRET,
  // please DO NOT set any value for COMPANION_ONEDRIVE_DOMAIN_VALIDATION
  if (process.env.COMPANION_ONEDRIVE_DOMAIN_VALIDATION === 'true' && process.env.COMPANION_ONEDRIVE_KEY) {
    app.get('/.well-known/microsoft-identity-association.json', (req, res) => {
      const content = JSON.stringify({
        associatedApplications: [
          { applicationId: process.env.COMPANION_ONEDRIVE_KEY },
        ],
      })
      res.header('Content-Length', `${Buffer.byteLength(content, 'utf8')}`)
      // use writeHead to prevent 'charset' from being appended
      // https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-configure-publisher-domain#to-select-a-verified-domain
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.write(content)
      res.end()
    })
  }

  app.use((req, res, next) => {
    return res.status(404).json({ message: 'Not Found' })
  })

  // @ts-ignore
  app.use((err, req, res, next) => {
    const logStackTrace = true
    if (app.get('env') === 'production') {
      // if the error is a URIError from the requested URL we only log the error message
      // to avoid uneccessary error alerts
      if (err.status === 400 && err instanceof URIError) {
        logger.error(err.message, 'root.error', req.id)
      } else {
        logger.error(err, 'root.error', req.id, logStackTrace)
      }
      res.status(err.status || 500).json({ message: 'Something went wrong', requestId: req.id })
    } else {
      logger.error(err, 'root.error', req.id, logStackTrace)
      res.status(err.status || 500).json({ message: err.message, error: err, requestId: req.id })
    }
  })

  return { app, companionOptions }
}

module.exports = { server }
