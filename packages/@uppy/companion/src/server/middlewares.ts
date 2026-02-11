import type { CorsOptions } from 'cors'
import corsImport from 'cors'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import promBundle from 'express-prom-bundle'

import packageJson from '../../package.json' with { type: 'json' }
import type { CompanionRuntimeOptions } from '../types/companion-options.ts'
import * as tokenService from './helpers/jwt.ts'
import { isRecord } from './helpers/type-guards.ts'
import { getURLBuilder } from './helpers/utils.ts'
import * as logger from './logger.ts'
import { isOAuthProvider } from './provider/Provider.ts'
import getS3Client from './s3-client.ts'

export const hasSessionAndProvider: RequestHandler = (req, res, next) => {
  if (!req.session) {
    logger.debug(
      'No session attached to req object. Exiting dispatcher.',
      undefined,
      req.id,
    )
    return res.sendStatus(400)
  }

  if (!req.companion.provider) {
    logger.debug(
      'No provider/provider-handler found. Exiting dispatcher.',
      undefined,
      req.id,
    )
    return res.sendStatus(400)
  }

  return next()
}

const isOAuthProviderReq = (req: Request) =>
  isOAuthProvider(req.companion.providerClass?.oauthProvider)
const isSimpleAuthProviderReq = (req: Request) =>
  !!req.companion.providerClass?.hasSimpleAuth
const isEncryptionSecret = (value: unknown): value is string | Buffer =>
  typeof value === 'string' || Buffer.isBuffer(value)

/**
 * Middleware can be used to verify that the current request is to an OAuth provider
 * This is because not all requests are supported by non-oauth providers (formerly known as SearchProviders)
 */
export const hasOAuthProvider: RequestHandler = (req, res, next) => {
  if (!isOAuthProviderReq(req)) {
    logger.debug('Provider does not support OAuth.', undefined, req.id)
    return res.sendStatus(400)
  }

  return next()
}

export const hasSimpleAuthProvider: RequestHandler = (req, res, next) => {
  if (!isSimpleAuthProviderReq(req)) {
    logger.debug('Provider does not support simple auth.', undefined, req.id)
    return res.sendStatus(400)
  }

  return next()
}

export const hasBody: RequestHandler = (req, res, next) => {
  if (!req.body) {
    logger.debug(
      'No body attached to req object. Exiting dispatcher.',
      undefined,
      req.id,
    )
    return res.sendStatus(400)
  }

  return next()
}

export const hasSearchQuery: RequestHandler = (req, res, next) => {
  if (typeof req.query['q'] !== 'string') {
    logger.debug(
      'search request has no search query',
      'search.query.check',
      req.id,
    )
    return res.sendStatus(400)
  }

  return next()
}

export const verifyToken: RequestHandler = (req, res, next) => {
  if (isOAuthProviderReq(req) || isSimpleAuthProviderReq(req)) {
    // For OAuth / simple auth provider, we find the encrypted auth token from the header:
    const token = req.companion.authToken
    if (typeof token !== 'string') {
      logger.info('cannot auth token', 'token.verify.unset', req.id)
      res.sendStatus(401)
      return
    }
    const secret = req.companion.options.secret
    if (!isEncryptionSecret(secret)) {
      logger.info('cannot auth token', 'token.verify.secret.unset', req.id)
      res.sendStatus(500)
      return
    }
    const providerName = req.params['providerName']
    if (typeof providerName !== 'string' || providerName.length === 0) {
      res.sendStatus(400)
      return
    }
    try {
      const payload = tokenService.verifyEncryptedAuthToken(
        token,
        secret,
        providerName,
      )
      req.companion.providerUserSession = payload[providerName]
    } catch (err) {
      logger.error(
        err instanceof Error ? err.message : String(err),
        'token.verify.error',
        req.id,
      )
      res.sendStatus(401)
      return
    }
    next()
    return
  }

  // for non auth providers, we just load the static key from options
  if (!isOAuthProviderReq(req)) {
    const { providerOptions } = req.companion.options
    const providerName = req.params['providerName']
    if (typeof providerName !== 'string' || providerName.length === 0) {
      res.sendStatus(400)
      return
    }
    const providerOption = providerOptions?.[providerName]
    const key =
      isRecord(providerOption) && typeof providerOption['key'] === 'string'
        ? providerOption['key']
        : undefined
    if (!key) {
      logger.info(
        `unconfigured credentials for ${providerName}`,
        'non.oauth.token.load.unset',
        req.id,
      )
      res.sendStatus(501)
      return
    }

    req.companion.providerUserSession = {
      accessToken: key,
    }
    next()
  }
}

// does not fail if token is invalid
export const gentleVerifyToken: RequestHandler = (req, res, next) => {
  const providerName = req.params['providerName']
  if (typeof providerName !== 'string' || providerName.length === 0) {
    next()
    return
  }
  const secret = req.companion.options.secret
  if (!isEncryptionSecret(secret)) {
    next()
    return
  }
  if (typeof req.companion.authToken === 'string') {
    try {
      const payload = tokenService.verifyEncryptedAuthToken(
        req.companion.authToken,
        secret,
        providerName,
      )
      req.companion.providerUserSession = payload[providerName]
    } catch (err) {
      logger.error(
        err instanceof Error ? err.message : String(err),
        'token.gentle.verify.error',
        req.id,
      )
    }
  }
  next()
}

export const cookieAuthToken: RequestHandler = (req, res, next) => {
  const oauthProvider = req.companion.providerClass?.oauthProvider
  if (typeof oauthProvider !== 'string' || oauthProvider.length === 0) {
    return next()
  }
  req.companion.authToken = req.cookies[`uppyAuthToken--${oauthProvider}`]
  return next()
}

function isCorsOrigin(value: unknown): value is CorsOptions['origin'] {
  if (typeof value === 'boolean') return true
  if (typeof value === 'string') return true
  if (value instanceof RegExp) return true
  if (typeof value === 'function') return true
  if (Array.isArray(value)) {
    return value.every((v) => typeof v === 'string' || v instanceof RegExp)
  }
  return false
}

export const cors =
  (options: {
    corsOrigins?: CompanionRuntimeOptions['corsOrigins']
    sendSelfEndpoint?: CompanionRuntimeOptions['sendSelfEndpoint']
  }): RequestHandler =>
  (req, res, next) => {
    // HTTP headers are not case sensitive, and express always handles them in lower case, so that's why we lower case them.
    // I believe that HTTP verbs are case sensitive, and should be uppercase.

    const existingExposeHeaders = res.get('Access-Control-Expose-Headers')
    const exposeHeadersSet = new Set(
      existingExposeHeaders
        ?.split(',')
        ?.map((method) => method.trim().toLowerCase()),
    )

    const sendSelfEndpoint = options['sendSelfEndpoint']
    if (typeof sendSelfEndpoint === 'string' && sendSelfEndpoint.length > 0) {
      exposeHeadersSet.add('i-am')
    }

    // Needed for basic operation: https://github.com/transloadit/uppy/issues/3021
    const allowedHeaders = [
      'uppy-auth-token',
      'uppy-credentials-params',
      'authorization',
      'origin',
      'content-type',
      'accept',
    ]
    const existingAllowHeaders = res.get('Access-Control-Allow-Headers')
    const allowHeadersSet = new Set(
      existingAllowHeaders
        ? existingAllowHeaders
            .split(',')
            .map((method) => method.trim().toLowerCase())
            .concat(allowedHeaders)
        : allowedHeaders,
    )

    const existingAllowMethods = res.get('Access-Control-Allow-Methods')
    const allowMethodsSet = new Set(
      existingAllowMethods
        ?.split(',')
        ?.map((method) => method.trim().toUpperCase()),
    )
    // Needed for basic operation:
    allowMethodsSet.add('GET').add('POST').add('OPTIONS').add('DELETE')

    // If endpoint urls are specified, then we only allow those endpoints.
    // Otherwise, we allow any client url to access companion.
    // Must be set to at least true (origin "*" with "credentials: true" will cause error in many browsers)
    // https://github.com/expressjs/cors/issues/119
    // allowedOrigins can also be any type supported by https://github.com/expressjs/cors#configuration-options
    const originCandidate = options['corsOrigins']
    const origin = isCorsOrigin(originCandidate) ? originCandidate : true

    // Because we need to merge with existing headers, we need to call cors inside our own middleware
    const corsOptions = {
      credentials: true,
      methods: Array.from(allowMethodsSet),
      allowedHeaders: Array.from(allowHeadersSet).join(','),
      exposedHeaders: Array.from(exposeHeadersSet).join(','),
      ...(origin === undefined ? {} : { origin }),
    } satisfies CorsOptions
    return corsImport(corsOptions)(req, res, next)
  }

function hasPromClient(mw: unknown): mw is RequestHandler & {
  promClient: {
    collectDefaultMetrics: (opts: unknown) => void
    Gauge: new (opts: unknown) => { set: (n: number) => void }
    register: unknown
  }
} {
  return !!mw && typeof mw === 'function' && 'promClient' in mw
}

export const metrics = ({
  path = undefined,
}: {
  path?: string
} = {}): RequestHandler => {
  const metricsMiddleware = promBundle({
    includeMethod: true,
    ...(path ? { metricsPath: `${path}/metrics` } : {}),
  })
  if (!hasPromClient(metricsMiddleware)) return metricsMiddleware
  const { promClient } = metricsMiddleware
  const { collectDefaultMetrics } = promClient
  collectDefaultMetrics({ register: promClient.register })

  // Add version as a prometheus gauge
  const versionGauge = new promClient.Gauge({
    name: 'companion_version',
    help: 'npm version as an integer',
  })
  const numberVersion = Number(packageJson.version.replace(/\D/g, ''))
  versionGauge.set(numberVersion)
  return metricsMiddleware
}

export const getCompanionMiddleware = (
  options: CompanionRuntimeOptions,
): RequestHandler => {
  const middleware = (req: Request, _res: Response, next: NextFunction) => {
    const s3Client = getS3Client(options, false)
    const s3ClientCreatePresignedPost = getS3Client(options, true)
    const authToken =
      req.header('uppy-auth-token') || req.query['uppyAuthToken']

    req.companion = {
      options,
      buildURL: getURLBuilder(options),
      ...(s3Client ? { s3Client } : {}),
      ...(s3ClientCreatePresignedPost ? { s3ClientCreatePresignedPost } : {}),
      ...(authToken === undefined ? {} : { authToken }),
    }
    next()
  }

  return middleware
}
