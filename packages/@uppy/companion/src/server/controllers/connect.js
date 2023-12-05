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
module.exports = function connect(req, res) {
  const { secret } = req.companion.options
  const stateObj = oAuthState.generateState()

  if (req.query.state) {
    const { origin } = JSON.parse(atob(req.query.state))
    stateObj.origin = origin
  }

  if (req.companion.options.server.oauthDomain) {
    stateObj.companionInstance = req.companion.buildURL('', true)
  }

  if (req.query.uppyPreAuthToken) {
    stateObj.preAuthToken = req.query.uppyPreAuthToken
  }

  const state = oAuthState.encodeState(stateObj, secret)
  const { providerClass, providerGrantConfig } = req.companion

  // pass along grant's dynamic config (if specified for the provider in its grant config `dynamic` section)
  // this is needed for things like custom oauth domain (e.g. webdav)
  const grantDynamicConfig = Object.fromEntries(providerGrantConfig.dynamic?.flatMap((dynamicKey) => {
    const queryValue = req.query[dynamicKey];

    // note: when using credentialsURL (dynamic oauth credentials), dynamic has ['key', 'secret', 'redirect_uri']
    // but in that case, query string is empty, so we need to only fetch these parameters from QS if they exist.
    if (!queryValue) return []
    return [[
      dynamicKey, queryValue
    ]]
  }) || [])

  const { authProvider } = providerClass
  const qs = queryString({
    ...grantDynamicConfig,
    state,
  })

  // Now we redirect to grant's /connect endpoint, see `app.use(Grant(grantConfig))`
  res.redirect(req.companion.buildURL(`/connect/${authProvider}${qs}`, true))
}
