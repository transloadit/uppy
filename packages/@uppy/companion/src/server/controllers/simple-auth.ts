import * as tokenService from '../helpers/jwt.js'
import { isRecord } from '../helpers/type-guards.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'
import type { NextFunction, Request, Response } from 'express'

export default async function simpleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { providerName } = req.params
  const secret = req.companion.options.secret
  if (typeof secret !== 'string' && !Buffer.isBuffer(secret)) {
    res.sendStatus(500)
    return
  }
  const { provider, providerClass } = req.companion
  if (!provider || !providerClass) {
    res.sendStatus(400)
    return
  }

  try {
    const out: unknown = await provider.simpleAuth({
      requestBody: req.body,
    })
    const simpleAuthResponse = isRecord(out) ? out : {}

    req.companion.providerUserSession = {
      ...(isRecord(req.companion.providerUserSession)
        ? req.companion.providerUserSession
        : {}),
      ...simpleAuthResponse,
    }

    logger.debug(
      `Generating simple auth token for provider ${providerName}`,
      null,
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
