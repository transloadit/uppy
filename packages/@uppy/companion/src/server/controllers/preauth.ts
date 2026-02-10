import logger from '../logger.ts'
import * as tokenService from '../helpers/jwt.ts'

export default function preauth(req, res) {
  if (!req.body || !req.body.params) {
    logger.info('invalid request data received', 'preauth.bad')
    return res.sendStatus(400)
  }

  const providerConfig =
    req.companion.options.providerOptions[req.params.providerName]
  if (!providerConfig?.credentialsURL) {
    return res.sendStatus(501)
  }

  const preAuthToken = tokenService.generateEncryptedToken(
    req.body.params,
    req.companion.options.preAuthSecret,
  )
  return res.json({ token: preAuthToken })
}
