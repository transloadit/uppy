const qs = require('querystring')
const parseUrl = require('url').parse // eslint-disable-line node/no-deprecated-api
const { hasMatch } = require('../helpers/utils')
const oAuthState = require('../helpers/oauth-state')

/**
 *
 * @param {object} req
 * @param {object} res
 */
module.exports = function oauthRedirect (req, res) {
  const dynamic = (req.session.grant || {}).dynamic || {}
  const state = dynamic.state
  if (!state) {
    return res.status(400).send('Cannot find state in session')
  }
  const handler = oAuthState.getFromState(state, 'companionInstance', req.companion.options.secret)
  const handlerHostName = parseUrl(handler).host

  if (hasMatch(handlerHostName, req.companion.options.server.validHosts)) {
    const providerName = req.companion.provider.authProvider
    const params = qs.stringify(req.query)
    const url = `${handler}/connect/${providerName}/callback?${params}`
    return res.redirect(url)
  }

  res.status(400).send('Invalid Host in state')
}
