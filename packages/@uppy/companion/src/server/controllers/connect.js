const atob = require('atob')
const oAuthState = require('../helpers/oauth-state')

const queryString = (params, prefix = '') => {
  const str = new URLSearchParams(params).toString()
  return str ? `${prefix}${str}` : ''
}

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

  const providerName = req.companion.provider.authProvider
  const qs = queryString(Object.fromEntries(
    req.companion.options.providerOptions[providerName]?.dynamic?.map(p => [p, req.query[p]]) || [],
  ), '&')

  res.redirect(req.companion.buildURL(`/connect/${providerName}?state=${state}${qs}`, true))
}
