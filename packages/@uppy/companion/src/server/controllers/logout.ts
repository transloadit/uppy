import type { NextFunction, Request, Response } from 'express'
import * as tokenService from '../helpers/jwt.ts'
import { isRecord } from '../helpers/type-guards.ts'
import { respondWithError } from '../provider/error.ts'

export default async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
  ): Promise<void> {
  const cleanSession = (): void => {
    const session = isRecord(req.session) ? req.session : null
    const grant = session && isRecord(session['grant']) ? session['grant'] : null
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
    const out: unknown = await provider.logout({
      providerUserSession,
      companion,
    })
    const data = isRecord(out) ? out : {}
    delete companion.providerUserSession
    const oauthProvider = providerClass?.oauthProvider
    if (typeof oauthProvider === 'string' && oauthProvider.length > 0) {
      tokenService.removeFromCookies(res, companion.options, oauthProvider)
    }
    cleanSession()
    res.json({ ok: true, ...data })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
