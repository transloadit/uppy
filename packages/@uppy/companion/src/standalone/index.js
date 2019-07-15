const express = require('express')
const qs = require('querystring')
const uppy = require('../uppy')
const helmet = require('helmet')
const morgan = require('morgan')
const bodyParser = require('body-parser')
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

app.use(addRequestId)
// log server requests.
app.use(morgan('combined'))
morgan.token('url', (req, res) => {
  const mask = (key) => {
    // don't log access_tokens in urls
    const query = Object.assign({}, req.query)
    // replace logged access token with xxxx character
    query[key] = 'x'.repeat(req.query[key].length)
    return `${req.path}?${qs.stringify(query)}`
  }

  if (req.query && req.query['access_token']) {
    return mask('access_token')
  } else if (req.query && req.query['uppyAuthToken']) {
    return mask('uppyAuthToken')
  }

  return req.originalUrl || req.url
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

const uppyOptions = helper.getUppyOptions()
const sessionOptions = {
  secret: uppyOptions.secret,
  resave: true,
  saveUninitialized: true
}

if (process.env.COMPANION_REDIS_URL) {
  const RedisStore = require('connect-redis')(session)
  sessionOptions.store = new RedisStore({
    url: process.env.COMPANION_REDIS_URL
  })
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
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  next()
})

// Routes
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send(helper.buildHelpfulStartupMessage(uppyOptions))
})

// initialize uppy
helper.validateConfig(uppyOptions)
if (process.env.COMPANION_PATH) {
  app.use(process.env.COMPANION_PATH, uppy.app(uppyOptions))
} else {
  app.use(uppy.app(uppyOptions))
}

app.use((req, res, next) => {
  return res.status(404).json({ message: 'Not Found' })
})

if (app.get('env') === 'production') {
  // @ts-ignore
  app.use((err, req, res, next) => {
    console.error('\x1b[31m', req.id, err, '\x1b[0m')
    res.status(err.status || 500).json({ message: 'Something went wrong', requestId: req.id })
  })
} else {
  // @ts-ignore
  app.use((err, req, res, next) => {
    console.error('\x1b[31m', req.id, err, '\x1b[0m')
    res.status(err.status || 500).json({ message: err.message, error: err, requestId: req.id })
  })
}

module.exports = { app, uppyOptions }
