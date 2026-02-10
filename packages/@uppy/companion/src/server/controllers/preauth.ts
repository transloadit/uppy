import * as tokenService from '../helpers/jwt.js'
import { isRecord } from '../helpers/type-guards.js'
import logger from '../logger.js'
import type { Request, Response } from 'express'

export default function preauth(req: Request, res: Response): void {
  const body = isRecord(req.body) ? req.body : null
  const params = body && Object.hasOwn(body, 'params') ? body.params : undefined
  if (!params) {
    logger.info('invalid request data received', 'preauth.bad')
    res.sendStatus(400)
    return
  }

  const providerConfig =
    req.companion.options.providerOptions[req.params.providerName]
  const credentialsURL =
    isRecord(providerConfig) && typeof providerConfig.credentialsURL === 'string'
      ? providerConfig.credentialsURL
      : undefined
  if (!credentialsURL) {
    res.sendStatus(501)
    return
  }

  const { preAuthSecret } = req.companion.options
  if (typeof preAuthSecret !== 'string' && !Buffer.isBuffer(preAuthSecret)) {
    res.sendStatus(500)
    return
  }
  const preAuthToken = tokenService.generateEncryptedToken(
    params,
    preAuthSecret,
  )
  res.json({ token: preAuthToken })
}
