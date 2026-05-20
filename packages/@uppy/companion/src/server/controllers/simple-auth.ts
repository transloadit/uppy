import type { NextFunction, Request, Response } from 'express'
import * as tokenService from '../helpers/jwt.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'

export default async function simpleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const providerName = req.params['providerName']
  if (providerName == null || providerName.length === 0) {
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
