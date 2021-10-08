const atob = require('atob')
const oAuthState = require('../helpers/oauth-state')

/**
 * initializes the oAuth flow for a provider.
 *
 * @param {object} req
 * @param {object} res
 */
module.exports = function connect (req, res) {
  const { secret } = req.companion.options
  let state = oAuthState.generateState(secret)
  if (req.query.state) {
    const origin = JSON.parse(atob(req.query.state))
    state = oAuthState.addToState(state, origin, secret)
  }

  if (req.companion.options.server.oauthDomain) {
    state = oAuthState.addToState(state, { companionInstance: req.companion.buildURL('', true) }, secret)
  }

  if (req.companion.clientVersion) {
    state = oAuthState.addToState(state, { clientVersion: req.companion.clientVersion }, secret)
  }

  if (req.query.uppyPreAuthToken) {
    state = oAuthState.addToState(state, { preAuthToken: req.query.uppyPreAuthToken }, secret)
  }

  res.redirect(req.companion.buildURL(`/connect/${req.companion.provider.authProvider}?state=${state}`, true))
}
