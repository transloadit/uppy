const tokenService = require('../helpers/jwt')

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
  const token = req.uppy.providerTokens ? req.uppy.providerTokens[providerName] : null
  if (token) {
    req.uppy.provider.logout({ token }, (err, data) => {
      if (err) {
        return next(err)
      }

      delete req.uppy.providerTokens[providerName]
      tokenService.removeFromCookies(res, req.uppy.options, req.uppy.provider.authProviderName)
      cleanSession()
      res.json(Object.assign({ ok: true }, data))
    })
  } else {
    cleanSession()
    res.json({ ok: true, revoked: false })
  }
}

module.exports = logout
