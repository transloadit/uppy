/**
 * oAuth callback.  Encrypts the access token and sends the new token with the response,
 */

import emitter from '../emitter/index.js'
import {
  authCallbackErrorHtml,
  legacyAuthCallbackHtml,
} from '../helpers/html.js'
import * as tokenService from '../helpers/jwt.js'
import * as oAuthState from '../helpers/oauth-state.js'
import logger from '../logger.js'

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
export default function callback(req, res, next) {
  const { providerName } = req.params
  const { companion } = req

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

    const authCallbackToken = oAuthState.getFromState(
      grantDynamic.state,
      'authCallbackToken',
      companion.options.secret,
    )
    // only new Uppy clients will set an authCallbackToken in the state
    // in that case, we send the token through the emitter.
    if (authCallbackToken) {
      emitter().emit(authCallbackToken, { error: true })
      res.status(400).send(authCallbackErrorHtml())
    } else {
      // This is backwards compatible with old Uppy clients:
      res.status(400).send(legacyAuthCallbackHtml({ error: true }, origin))
    }

    return
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
