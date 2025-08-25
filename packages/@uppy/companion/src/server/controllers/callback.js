/**
 * oAuth callback.  Encrypts the access token and sends the new token with the response,
 */
import serialize from 'serialize-javascript'
import * as tokenService from '../helpers/jwt.js'
import * as oAuthState from '../helpers/oauth-state.js'
import logger from '../logger.js'

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
export default function callback(req, res, next) {
  const { providerName } = req.params

  const grant = req.session.grant || {}

  const grantDynamic = oAuthState.getGrantDynamicFromRequest(req)
  const origin =
    grantDynamic.state &&
    oAuthState.getFromState(
      grantDynamic.state,
      'origin',
      req.companion.options.secret,
    )

  if (!grant.response?.access_token) {
    logger.debug(
      `Did not receive access token for provider ${providerName}`,
      null,
      req.id,
    )
    logger.debug(grant.response, 'callback.oauth.resp', req.id)
    return res.status(400).send(closePageHtml(origin))
  }

  const { access_token: accessToken, refresh_token: refreshToken } =
    grant.response

  req.companion.providerUserSession = {
    accessToken,
    refreshToken, // might be undefined for some providers
    ...req.companion.providerClass.grantDynamicToUserSession({ grantDynamic }),
  }

  logger.debug(
    `Generating auth token for provider ${providerName}. refreshToken: ${refreshToken ? 'yes' : 'no'}`,
    null,
    req.id,
  )
  const uppyAuthToken = tokenService.generateEncryptedAuthToken(
    { [providerName]: req.companion.providerUserSession },
    req.companion.options.secret,
    req.companion.providerClass.authStateExpiry,
  )

  tokenService.addToCookiesIfNeeded(
    req,
    res,
    uppyAuthToken,
    req.companion.providerClass.authStateExpiry,
  )

  return res.redirect(
    req.companion.buildURL(
      `/${providerName}/send-token?uppyAuthToken=${uppyAuthToken}`,
      true,
    ),
  )
}
