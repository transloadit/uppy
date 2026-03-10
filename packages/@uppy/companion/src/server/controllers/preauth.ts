import type { Request, Response } from 'express'
import * as tokenService from '../helpers/jwt.ts'
import { isRecord } from '../helpers/type-guards.ts'
import logger from '../logger.ts'

export default function preauth(req: Request, res: Response): void {
  const body = isRecord(req.body) ? req.body : undefined
  const params =
    body && Object.hasOwn(body, 'params') ? body['params'] : undefined
  if (!params) {
    logger.info('invalid request data received', 'preauth.bad')
    res.sendStatus(400)
    return
  }

  const providerName = req.params['providerName']
  if (providerName == null || providerName.length === 0) {
    res.sendStatus(400)
    return
  }

  const credentialsURL =
    req.companion.options.providerOptions[providerName]?.credentialsURL
  if (!credentialsURL) {
    res.sendStatus(501)
    return
  }

  const { preAuthSecret } = req.companion.options
  if (preAuthSecret == null) {
    res.sendStatus(500)
    return
  }
  const preAuthToken = tokenService.generateEncryptedToken(
    params,
    preAuthSecret,
  )
  res.json({ token: preAuthToken })
}
