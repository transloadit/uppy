const atob = require('atob')
const oAuthState = require('../helpers/oauth-state')

const queryString = (params, prefix = '?') => {
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
  const { providerClass, providerGrantConfig } = req.companion

  // pass along grant's dynamic config (if specified for the provider in its grant config `dynamic` section)
  const grantDynamicConfig = Object.fromEntries(providerGrantConfig.dynamic?.map(p => [p, req.query[p]]) || [])

  const { authProvider } = providerClass
  const qs = queryString({
    ...grantDynamicConfig,
    state,
  })

  // Now we redirect to grant's /connect endpoint, see `app.use(Grant(grantConfig))`
  res.redirect(req.companion.buildURL(`/connect/${authProvider}${qs}`, true))
}
