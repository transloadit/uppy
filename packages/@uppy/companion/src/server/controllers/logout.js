const tokenService = require('../helpers/jwt')
const { errorToResponse } = require('../provider/error')

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
  const token = companion.providerTokens ? companion.providerTokens[providerName] : null

  if (!token) {
    cleanSession()
    res.json({ ok: true, revoked: false })
    return
  }

  try {
    const data = await companion.provider.logout({ token, companion })
    delete companion.providerTokens[providerName]
    tokenService.removeFromCookies(res, companion.options, companion.provider.authProvider)
    cleanSession()
    res.json({ ok: true, ...data })
  } catch (err) {
    const errResp = errorToResponse(err)
    if (errResp) {
      res.status(errResp.code).json({ message: errResp.message })
      return
    }
    next(err)
  }
}

module.exports = logout
