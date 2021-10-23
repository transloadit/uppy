/**
 * oAuth callback.  Encrypts the access token and sends the new token with the response,
 */
const serialize = require('serialize-javascript')

const tokenService = require('../helpers/jwt')
const logger = require('../logger')
const oAuthState = require('../helpers/oauth-state')

const closePageHtml = (origin) => `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8" />
      <script>
      // if window.opener is nullish, we want the following line to throw to avoid
      // the window closing without informing the user.
      window.opener.postMessage(${serialize({ error: true })}, ${serialize(origin)})
      window.close()
      </script>
  </head>
  <body>Authentication failed.</body>
  </html>`

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
module.exports = function callback (req, res, next) { // eslint-disable-line no-unused-vars
  const { providerName } = req.params

  if (!req.companion.providerTokens) {
    req.companion.providerTokens = {}
  }

  const grant = req.session.grant || {}
  if (grant.response && grant.response.access_token) {
    req.companion.providerTokens[providerName] = grant.response.access_token
    logger.debug(`Generating auth token for provider ${providerName}`, null, req.id)
    const uppyAuthToken = tokenService.generateEncryptedToken(req.companion.providerTokens, req.companion.options.secret)
    return res.redirect(req.companion.buildURL(`/${providerName}/send-token?uppyAuthToken=${uppyAuthToken}`, true))
  }

  logger.debug(`Did not receive access token for provider ${providerName}`, null, req.id)
  logger.debug(grant.response, 'callback.oauth.resp', req.id)
  const state = oAuthState.getDynamicStateFromRequest(req)
  const origin = state && oAuthState.getFromState(state, 'origin', req.companion.options.secret)
  return res.status(400).send(closePageHtml(origin))
}
