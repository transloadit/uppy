import type { Response } from 'express'

import type { Request } from '../../types/express.js'

import * as tokenService from '../helpers/jwt.js'
import { isRecord } from '../helpers/type-guards.js'
import logger from '../logger.js'

export default function preauth(req: Request, res: Response): void {
  const { body } = req
  if (!isRecord(body) || !Object.hasOwn(body, 'params') || !body['params']) {
    logger.info('invalid request data received', 'preauth.bad')
    res.sendStatus(400)
    return
  }

  const providerName = req.params['providerName']
  if (typeof providerName !== 'string' || providerName.length === 0) {
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
    body['params'],
    preAuthSecret,
  )
  res.json({ token: preAuthToken })
}
