const tokenService = require('../helpers/jwt')
const { respondWithError } = require('../provider/error')

/**
 *
 * @param {{ query: object, params: object, companion: object, session: object }} req
 * @param {object} res
 */
async function logout ({ query, params, companion, session }, res, next) {
  const cleanSession = () => {
    if (session.grant) {
      session.grant.state = null
      session.grant.dynamic = null
    }
  }
  const { providerName } = params
  const tokens = companion.allProvidersTokens ? companion.allProvidersTokens[providerName] : null

  if (!tokens) {
    cleanSession()
    res.json({ ok: true, revoked: false })
    return
  }

  try {
    const { accessToken } = tokens
    const data = await companion.provider.logout({ companion, token: accessToken, query })
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
