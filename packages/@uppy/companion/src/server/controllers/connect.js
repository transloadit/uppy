const oAuthState = require('../helpers/oauth-state')
// @ts-ignore
const atob = require('atob')

/**
 * initializes the oAuth flow for a provider.
 *
 * @param {object} req
 * @param {object} res
 */
module.exports = function connect (req, res) {
  const secret = req.uppy.options.secret
  let state = oAuthState.generateState(secret)
  if (req.query.state) {
    // todo change this query from state to "origin"
    const origin = JSON.parse(atob(req.query.state))
    state = oAuthState.addToState(state, origin, secret)
  }

  if (req.uppy.options.server.oauthDomain) {
    state = oAuthState.addToState(state, { uppyInstance: req.uppy.buildURL('', true) }, secret)
  }

  res.redirect(req.uppy.buildURL(`/connect/${req.uppy.provider.authProvider}?state=${state}`, true))
}
