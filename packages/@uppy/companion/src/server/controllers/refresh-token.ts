import type { NextFunction, Request, Response } from 'express'
import * as tokenService from '../helpers/jwt.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'

// https://www.dropboxforum.com/t5/Dropbox-API-Support-Feedback/Get-refresh-token-from-access-token/td-p/596739
// https://developers.dropbox.com/oauth-guide
// https://github.com/simov/grant/issues/149
export default async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const providerName = req.params['providerName']
  if (providerName == null) {
    res.sendStatus(400)
    return
  }
  const { secret } = req.companion.options

  const providerConfig = req.companion.options.providerOptions?.[providerName]
  const clientId = providerConfig?.key
  const clientSecret = providerConfig?.secret
  const redirectUri = req.companion.providerGrantConfig?.redirect_uri

  const { provider, providerClass } = req.companion
  const { providerUserSession } = req.companion

  // not all providers have refresh tokens
  if (!providerUserSession?.refreshToken) {
    logger.warn('Tried to refresh token without having a token')
    res.sendStatus(401)
    return
  }
  if (!provider || !providerClass) {
    res.sendStatus(400)
    return
  }

  try {
    const { accessToken } = await provider.refreshToken({
      redirectUri,
      clientId,
      clientSecret,
      refreshToken: providerUserSession.refreshToken,
    })

    req.companion.providerUserSession = {
      ...providerUserSession,
      accessToken,
    }

    logger.debug(
      `Generating refreshed auth token for provider ${providerName}`,
      undefined,
      req.id,
    )
    const uppyAuthToken = tokenService.generateEncryptedAuthToken(
      { [providerName]: req.companion.providerUserSession },
      secret,
      providerClass.authStateExpiry,
    )

    tokenService.addToCookiesIfNeeded(
      req,
      res,
      uppyAuthToken,
      providerClass.authStateExpiry,
    )

    res.send({ uppyAuthToken })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
