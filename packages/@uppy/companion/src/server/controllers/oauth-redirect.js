const qs = require('node:querystring')
const { URL } = require('node:url')
const { hasMatch } = require('../helpers/utils')
const oAuthState = require('../helpers/oauth-state')

/**
 *
 * @param {object} req
 * @param {object} res
 */
module.exports = function oauthRedirect (req, res) {
  const params = qs.stringify(req.query)
  const { authProvider } = req.companion.provider
  if (!req.companion.options.server.oauthDomain) {
    return res.redirect(req.companion.buildURL(`/connect/${authProvider}/callback?${params}`, true))
  }

  const state = oAuthState.getDynamicStateFromRequest(req)
  if (!state) {
    return res.status(400).send('Cannot find state in session')
  }
  const handler = oAuthState.getFromState(state, 'companionInstance', req.companion.options.secret)
  const handlerHostName = (new URL(handler)).host

  if (hasMatch(handlerHostName, req.companion.options.server.validHosts)) {
    const url = `${handler}/connect/${authProvider}/callback?${params}`
    return res.redirect(url)
  }

  res.status(400).send('Invalid Host in state')
}
