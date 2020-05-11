const express = require('express')
const qs = require('querystring')
const companion = require('../companion')
const helmet = require('helmet')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const redis = require('../server/redis')
const logger = require('../server/logger')
const { parseURL } = require('../server/helpers/utils')
const merge = require('lodash.merge')
// @ts-ignore
const promBundle = require('express-prom-bundle')
const session = require('express-session')
const addRequestId = require('express-request-id')()
const helper = require('./helper')
// @ts-ignore
const { version } = require('../../package.json')

const app = express()

// for server metrics tracking.
const metricsMiddleware = promBundle({ includeMethod: true })
const promClient = metricsMiddleware.promClient
const collectDefaultMetrics = promClient.collectDefaultMetrics
const promInterval = collectDefaultMetrics({ register: promClient.register, timeout: 5000 })

// Add version as a prometheus gauge
const versionGauge = new promClient.Gauge({ name: 'companion_version', help: 'npm version as an integer' })
// @ts-ignore
const numberVersion = version.replace(/\D/g, '') * 1
versionGauge.set(numberVersion)

if (app.get('env') !== 'test') {
  clearInterval(promInterval)
}

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
    const parsed = parseURL(ref)
    const rawQuery = qs.parse(parsed.search.replace('?', ''))
    const { query, censored } = censorQuery(rawQuery)
    return censored ? `${parsed.href.split('?')[0]}?${qs.stringify(query)}` : parsed.href
  }
})

// make app metrics available at '/metrics'.
app.use(metricsMiddleware)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Use helmet to secure Express headers
app.use(helmet.frameguard())
app.use(helmet.xssFilter())
app.use(helmet.noSniff())
app.use(helmet.ieNoOpen())
app.disable('x-powered-by')

const companionOptions = helper.getCompanionOptions()
const sessionOptions = {
  secret: companionOptions.secret,
  resave: true,
  saveUninitialized: true
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
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}

app.use(session(sessionOptions))

app.use((req, res, next) => {
  const protocol = process.env.COMPANION_PROTOCOL || 'http'

  // if endpoint urls are specified, then we only allow those endpoints
  // otherwise, we allow any client url to access companion.
  // here we also enforce that only the protocol allowed by companion is used.
  if (process.env.COMPANION_CLIENT_ORIGINS) {
    const whitelist = process.env.COMPANION_CLIENT_ORIGINS
      .split(',')
      .map((url) => helper.hasProtocol(url) ? url : `${protocol}://${url}`)

    // @ts-ignore
    if (req.headers.origin && whitelist.indexOf(req.headers.origin) > -1) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
      // only allow credentials when origin is whitelisted
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Origin, Content-Type, Accept'
  )
  next()
})

// Routes
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send(helper.buildHelpfulStartupMessage(companionOptions))
})

// initialize companion
helper.validateConfig(companionOptions)
if (process.env.COMPANION_PATH) {
  app.use(process.env.COMPANION_PATH, companion.app(companionOptions))
} else {
  app.use(companion.app(companionOptions))
}

// WARNING: This route is added in order to validate your app with OneDrive.
// Only set COMPANION_ONEDRIVE_DOMAIN_VALIDATION if you are sure that you are setting the
// correct value for COMPANION_ONEDRIVE_KEY (i.e application ID). If there's a slightest possiblilty
// that you might have mixed the values for COMPANION_ONEDRIVE_KEY and COMPANION_ONEDRIVE_SECRET,
// please do not set a value for COMPANION_ONEDRIVE_DOMAIN_VALIDATION
if (process.env.COMPANION_ONEDRIVE_DOMAIN_VALIDATION === 'true' && process.env.COMPANION_ONEDRIVE_KEY) {
  app.get('/.well-known/microsoft-identity-association.json', (req, res) => {
    const content = JSON.stringify({
      associatedApplications: [
        { applicationId: process.env.COMPANION_ONEDRIVE_KEY }
      ]
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

module.exports = { app, companionOptions }
