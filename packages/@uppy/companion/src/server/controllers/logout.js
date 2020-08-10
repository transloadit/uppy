const tokenService = require('../helpers/jwt')
const { errorToResponse } = require('../provider/error')

/**
 *
 * @param {object} req
 * @param {object} res
 */
function logout (req, res, next) {
  const cleanSession = () => {
    if (req.session.grant) {
      req.session.grant.state = null
      req.session.grant.dynamic = null
    }
  }
  const providerName = req.params.providerName
  const companion = req.companion
  const token = companion.providerTokens ? companion.providerTokens[providerName] : null
  if (token) {
    companion.provider.logout({ token, companion }, (err, data) => {
      if (err) {
        const errResp = errorToResponse(err)
        if (errResp) {
          return res.status(errResp.code).json({ message: errResp.message })
        }
        return next(err)
      }

      delete companion.providerTokens[providerName]
      tokenService.removeFromCookies(res, companion.options, companion.provider.authProviderName)
      cleanSession()
      res.json(Object.assign({ ok: true }, data))
    })
  } else {
    cleanSession()
    res.json({ ok: true, revoked: false })
  }
}

module.exports = logout
