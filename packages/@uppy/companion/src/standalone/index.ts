import { randomUUID } from 'node:crypto'
import qs from 'node:querystring'
import { URL } from 'node:url'
import RedisStore from 'connect-redis'
import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import type { SessionOptions } from 'express-session'
import session from 'express-session'
import helmet from 'helmet'
import morgan from 'morgan'
import * as companion from '../companion.ts'
import type { StandaloneCompanionOptionsInput } from '../schemas/index.ts'
import { isRecord, toError } from '../server/helpers/type-guards.ts'
import logger from '../server/logger.ts'
import * as redis from '../server/redis.ts'
import {
  buildHelpfulStartupMessage,
  generateSecret,
  getCompanionOptions,
} from './helper.ts'

export default function server(
  inputCompanionOptions?: StandaloneCompanionOptionsInput,
) {
  const companionOptions = getCompanionOptions(inputCompanionOptions)

  companion.setLoggerProcessName(companionOptions)

  if (!companionOptions.secret)
    companionOptions.secret = generateSecret('secret')
  if (!companionOptions.preAuthSecret)
    companionOptions.preAuthSecret = generateSecret('preAuthSecret')

  const app = express()

  const router = express.Router()

  if (companionOptions.server.path) {
    app.use(companionOptions.server.path, router)
  } else {
    app.use(router)
  }

  // Query string keys whose values should not end up in logging output.
  const sensitiveKeys = new Set(['access_token', 'uppyAuthToken'])

  function censorQuery(rawQuery: Record<string, unknown>): {
    query: Record<string, string>
    censored: boolean
  } {
    const query: Record<string, string> = {}
    let censored = false
    Object.keys(rawQuery).forEach((key) => {
      const value = rawQuery[key]
      if (typeof value !== 'string') {
        return
      }
      if (sensitiveKeys.has(key)) {
        // replace logged access token
        query[key] = '********'
        censored = true
      } else {
        query[key] = value
      }
    })
    return { query, censored }
  }

  router.use((request, response, next) => {
    const headerName = 'X-Request-Id'
    const oldValue = request.get(headerName)
    response.set(headerName, oldValue ?? randomUUID())

    next()
  })
  // log server requests.
  router.use(morgan('combined'))
  morgan.token('url', (req) => {
    const { query, censored } = censorQuery(req.query)
    return censored
      ? `${req.path}?${qs.stringify(query)}`
      : req.originalUrl || req.url
  })

  morgan.token('referrer', (req) => {
    const ref = req.headers.referer || req.headers.referrer
    if (typeof ref === 'string') {
      let parsed: URL
      try {
        parsed = new URL(ref)
      } catch {
        return ref
      }
      const rawQuery = qs.parse(parsed.search.replace('?', ''))
      const { query, censored } = censorQuery(rawQuery)
      return censored
        ? `${parsed.href.split('?')[0]}?${qs.stringify(query)}`
        : parsed.href
    }
    return undefined
  })

  // Use helmet to secure Express headers
  router.use(helmet.frameguard())
  router.use(helmet.xssFilter())
  router.use(helmet.noSniff())
  router.use(helmet.ieNoOpen())

  app.disable('x-powered-by')

  const sessionOptions: SessionOptions = {
    secret: companionOptions.secret,
    resave: true,
    saveUninitialized: true,
  }

  const redisClient = redis.client(companionOptions)
  if (redisClient) {
    sessionOptions.store = new RedisStore({
      client: redisClient,
      prefix:
        process.env.COMPANION_REDIS_EXPRESS_SESSION_PREFIX ||
        'companion-session:',
    })
  }

  if (process.env.COMPANION_COOKIE_DOMAIN) {
    sessionOptions.cookie = {
      domain: process.env.COMPANION_COOKIE_DOMAIN,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  }

  // Session is used for grant redirects, so that we don't need to expose secret tokens in URLs
  // See https://github.com/transloadit/uppy/pull/1668
  // https://github.com/transloadit/uppy/issues/3538#issuecomment-1069232909
  // https://github.com/simov/grant#callback-session
  router.use(session(sessionOptions))

  // Routes
  if (process.env.COMPANION_HIDE_WELCOME !== 'true') {
    router.get('/', (req, res) => {
      res.setHeader('Content-Type', 'text/plain')
      res.send(buildHelpfulStartupMessage(companionOptions))
    })
  }

  // initialize companion
  const { app: companionApp } = companion.app(companionOptions)

  // add companion to server middleware
  router.use(companionApp)

  // WARNING: This route is added in order to validate your app with OneDrive.
  // Only set COMPANION_ONEDRIVE_DOMAIN_VALIDATION if you are sure that you are setting the
  // correct value for COMPANION_ONEDRIVE_KEY (i.e application ID). If there's a slightest possiblilty
  // that you might have mixed the values for COMPANION_ONEDRIVE_KEY and COMPANION_ONEDRIVE_SECRET,
  // please DO NOT set any value for COMPANION_ONEDRIVE_DOMAIN_VALIDATION
  if (
    process.env.COMPANION_ONEDRIVE_DOMAIN_VALIDATION === 'true' &&
    process.env.COMPANION_ONEDRIVE_KEY
  ) {
    router.get(
      '/.well-known/microsoft-identity-association.json',
      (req, res) => {
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
      },
    )
  }

  app.use((req, res) => {
    return res.status(404).json({ message: 'Not Found' })
  })

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const error = toError(err)
    const status = isRecord(err) ? err.status : undefined
    if (app.get('env') === 'production') {
      // if the error is a URIError from the requested URL we only log the error message
      // to avoid uneccessary error alerts
      if (status === 400 && error.name === 'URIError') {
        logger.error(error.message, 'root.error', req.id)
      } else {
        logger.error(err, 'root.error', req.id)
      }
      res
        .status(500)
        .json({ message: 'Something went wrong', requestId: req.id })
    } else {
      logger.error(err, 'root.error', req.id)
      res
        .status(500)
        .json({ message: error.message, error: err, requestId: req.id })
    }
  })

  return { app, companionOptions }
}
