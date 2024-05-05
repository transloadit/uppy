const tokenService = require('../helpers/jwt')
const { respondWithError } = require('../provider/error')

/**
 *
 * @param {object} req
 * @param {object} res
 */
async function logout (req, res, next) {
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
    const { accessToken } = providerUserSession
    const data = await companion.provider.logout({ token: accessToken, providerUserSession, companion })
    delete companion.providerUserSession
    tokenService.removeFromCookies(res, companion.options, companion.providerClass.authProvider)
    cleanSession()
    res.json({ ok: true, ...data })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

module.exports = logout
