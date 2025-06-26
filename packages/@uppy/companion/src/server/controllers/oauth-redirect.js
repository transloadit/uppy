const qs = require('node:querystring')
const { URL } = require('node:url')
const { hasMatch } = require('../helpers/utils')
const oAuthState = require('../helpers/oauth-state')

/**
 *
 * @param {object} req
 * @param {object} res
 */
module.exports = function oauthRedirect(req, res) {
  const params = qs.stringify(req.query)
  const { oauthProvider } = req.companion.providerClass
  if (!req.companion.options.server.oauthDomain) {
    res.redirect(
      req.companion.buildURL(
        `/connect/${oauthProvider}/callback?${params}`,
        true,
      ),
    )
    return
  }

  const { state } = oAuthState.getGrantDynamicFromRequest(req)
  if (!state) {
    res.status(400).send('Cannot find state in session')
    return
  }
  const handler = oAuthState.getFromState(
    state,
    'companionInstance',
    req.companion.options.secret,
  )
  const handlerHostName = new URL(handler).host

  if (hasMatch(handlerHostName, req.companion.options.server.validHosts)) {
    const url = `${handler}/connect/${oauthProvider}/callback?${params}`
    res.redirect(url)
    return
  }

  res.status(400).send('Invalid Host in state')
}
