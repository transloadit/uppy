import * as tokenService from '../helpers/jwt.js'
import { respondWithError } from '../provider/error.js'

/**
 *
 * @param {object} req
 * @param {object} res
 */
export default async function logout(req, res, next) {
  const cleanSession = () => {
    if (req.session.grant) {
      req.session.grant.state = null
      req.session.grant.dynamic = null
    }
  }
  const { companion } = req
  const { providerUserSession } = companion

  if (!providerUserSession) {
    cleanSession()
    res.json({ ok: true, revoked: false })
    return
  }

  try {
    const data = await companion.provider.logout({
      providerUserSession,
      companion,
    })
    delete companion.providerUserSession
    tokenService.removeFromCookies(
      res,
      companion.options,
      companion.providerClass.oauthProvider,
    )
    cleanSession()
    res.json({ ok: true, ...data })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
