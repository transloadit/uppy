const tokenService = require('../helpers/jwt')

/**
 *
 * @param {object} req
 * @param {object} res
 */
function logout (req, res) {
  const session = req.session
  const providerName = req.params.providerName

  if (req.uppy.providerTokens[providerName]) {
    delete req.uppy.providerTokens[providerName]
    tokenService.addToCookies(
      res,
      tokenService.generateToken(req.uppy.providerTokens, req.uppy.options.secret),
      req.uppy.options
    )
  }

  if (session.grant) {
    session.grant.state = null
    session.grant.dynamic = null
  }
  res.json({ ok: true })
}

module.exports = logout
