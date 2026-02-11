import type { NextFunction, Request, Response } from 'express'
import * as tokenService from '../helpers/jwt.ts'
import { isRecord } from '../helpers/type-guards.ts'
import logger from '../logger.ts'
import { respondWithError } from '../provider/error.ts'

// https://www.dropboxforum.com/t5/Dropbox-API-Support-Feedback/Get-refresh-token-from-access-token/td-p/596739
// https://developers.dropbox.com/oauth-guide
// https://github.com/simov/grant/issues/149
export default async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const providerName = req.params['providerName']
  if (typeof providerName !== 'string' || providerName.length === 0) {
    res.sendStatus(400)
    return
  }
  const secret = req.companion.options.secret
  if (typeof secret !== 'string' && !Buffer.isBuffer(secret)) {
    res.sendStatus(500)
    return
  }

  const providerConfig = req.companion.options.providerOptions?.[providerName]
  const clientId =
    isRecord(providerConfig) && typeof providerConfig['key'] === 'string'
      ? providerConfig['key']
      : undefined
  const clientSecret =
    isRecord(providerConfig) && typeof providerConfig['secret'] === 'string'
      ? providerConfig['secret']
      : undefined

  const redirectUri =
    isRecord(req.companion.providerGrantConfig) &&
    typeof req.companion.providerGrantConfig['redirect_uri'] === 'string'
      ? req.companion.providerGrantConfig['redirect_uri']
      : undefined

  const { provider, providerClass } = req.companion
  const providerUserSession = isRecord(req.companion.providerUserSession)
    ? req.companion.providerUserSession
    : null

  // not all providers have refresh tokens
  const refreshToken =
    providerUserSession &&
    typeof providerUserSession['refreshToken'] === 'string'
      ? providerUserSession['refreshToken']
      : undefined
  if (!refreshToken) {
    logger.warn('Tried to refresh token without having a token')
    res.sendStatus(401)
    return
  }
  if (!provider || !providerClass) {
    res.sendStatus(400)
    return
  }

  try {
    const out: unknown = await provider.refreshToken({
      redirectUri,
      clientId,
      clientSecret,
      refreshToken,
    })
    const accessToken =
      isRecord(out) && typeof out['accessToken'] === 'string'
        ? out['accessToken']
        : undefined
    if (!accessToken) {
      throw new Error('Provider did not return an accessToken')
    }

    req.companion.providerUserSession = {
      ...(providerUserSession ?? {}),
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
