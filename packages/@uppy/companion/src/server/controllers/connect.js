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
  const stateObj = oAuthState.generateState()

  if (req.query.state) {
    const { origin } = JSON.parse(atob(req.query.state))
    stateObj.origin = origin
  }

  if (req.companion.options.server.oauthDomain) {
    stateObj.companionInstance = req.companion.buildURL('', true)
  }

  if (req.companion.clientVersion) {
    stateObj.clientVersion = req.companion.clientVersion
  }

  if (req.query.uppyPreAuthToken) {
    stateObj.preAuthToken = req.query.uppyPreAuthToken
  }

  const state = oAuthState.encodeState(stateObj, secret)
  res.redirect(req.companion.buildURL(`/connect/${req.companion.provider.authProvider}?state=${state}`, true))
}
