import type { NextFunction, Request, Response } from 'express'
import * as tokenService from '../helpers/jwt.ts'
import { respondWithError } from '../provider/error.ts'

export default async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const cleanSession = (): void => {
    const grant = req.session?.grant
    if (grant) {
      grant['state'] = null
      grant['dynamic'] = null
    }
  }
  const { companion } = req
  const { providerUserSession, provider, providerClass } = companion

  if (!providerUserSession) {
    cleanSession()
    res.json({ ok: true, revoked: false })
    return
  }
  if (!provider) {
    cleanSession()
    res.sendStatus(400)
    return
  }

  try {
    const out = await provider.logout({
      providerUserSession,
      companion,
    })
    delete companion.providerUserSession
    const oauthProvider = providerClass?.oauthProvider
    if (oauthProvider != null) {
      tokenService.removeFromCookies(res, companion.options, oauthProvider)
    }
    cleanSession()
    res.json({ ok: true, ...out })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
