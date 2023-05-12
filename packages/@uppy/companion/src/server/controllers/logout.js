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
  const { providerName } = req.params
  const { companion } = req
  const tokens = companion.allProvidersTokens ? companion.allProvidersTokens[providerName] : null

  if (!tokens) {
    cleanSession()
    res.json({ ok: true, revoked: false })
    return
  }

  try {
    const { accessToken } = tokens
    const data = await companion.provider.logout({ token: accessToken, companion })
    delete companion.allProvidersTokens[providerName]
    tokenService.removeFromCookies(res, companion.options, companion.provider.authProvider)
    cleanSession()
    res.json({ ok: true, ...data })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

module.exports = logout
