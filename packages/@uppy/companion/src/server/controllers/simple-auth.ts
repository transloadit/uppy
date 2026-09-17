import type { NextFunction, Request, Response } from 'express'
import type { ProviderUserSession } from '../../types/express.js'
import * as tokenService from '../helpers/jwt.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'
import type { ProviderCtor } from '../provider/Provider.js'

/**
 * Lifetime, in seconds, of the session token issued after `simpleAuth()`.
 * A provider session that expires earlier than `authStateExpiry` (`exp`, unix
 * seconds) caps the token, so it expires with the session instead of the
 * session being re-checked on every request.
 */
function getTokenMaxAge(
  providerClass: ProviderCtor,
  providerUserSession: ProviderUserSession | undefined,
): number {
  const exp = providerUserSession?.exp
  if (typeof exp !== 'number') return providerClass.authStateExpiry
  return Math.min(
    providerClass.authStateExpiry,
    Math.max(0, exp - Math.floor(Date.now() / 1000)),
  )
}

export default async function simpleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const providerName = req.params['providerName']
  if (typeof providerName !== 'string' || providerName.length === 0) {
    res.sendStatus(400)
    return
  }
  const { secret } = req.companion.options
  const { provider, providerClass } = req.companion
  if (!provider || !providerClass) {
    res.sendStatus(400)
    return
  }

  try {
    const simpleAuthResponse = await provider.simpleAuth({
      requestBody: req.body,
      companion: req.companion,
    })

    req.companion.providerUserSession = {
      ...req.companion.providerUserSession,
      ...simpleAuthResponse,
    }

    logger.debug(
      `Generating simple auth token for provider ${providerName}`,
      undefined,
      req.id,
    )
    const maxAge = getTokenMaxAge(
      providerClass,
      req.companion.providerUserSession,
    )
    const uppyAuthToken = tokenService.generateEncryptedAuthToken(
      { [providerName]: req.companion.providerUserSession },
      secret,
      maxAge,
    )

    tokenService.addToCookiesIfNeeded(req, res, uppyAuthToken, maxAge)

    res.send({ uppyAuthToken })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
