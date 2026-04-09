import emitter from '../emitter/index.js'
import {
  authCallbackSuccessHtml,
  legacyAuthCallbackHtml,
} from '../helpers/html.js'
import * as oAuthState from '../helpers/oauth-state.js'
import { isOriginAllowed } from './connect.js'

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export default function sendToken(req, res, next) {
  // @ts-expect-error untyped
  const { companion } = req
  const uppyAuthToken = companion.authToken

  const { state } = oAuthState.getGrantDynamicFromRequest(req)

  if (!state) {
    return next()
  }

  const clientOrigin = oAuthState.getFromState(
    state,
    'origin',
    companion.options.secret,
  )
  const customerDefinedAllowedOrigins = oAuthState.getFromState(
    state,
    'customerDefinedAllowedOrigins',
    companion.options.secret,
  )

  if (
    customerDefinedAllowedOrigins &&
    !isOriginAllowed(clientOrigin, customerDefinedAllowedOrigins)
  ) {
    return next()
  }

  const authCallbackToken = oAuthState.getFromState(
    state,
    'authCallbackToken',
    companion.options.secret,
  )
  // only new Uppy clients will set an authCallbackToken in the state
  // in that case, we send the token through the emitter.
  if (authCallbackToken) {
    emitter().emit(authCallbackToken, { token: uppyAuthToken })
    res.send(authCallbackSuccessHtml())
  } else {
    // This is backwards compatible with old Uppy clients:
    res.send(legacyAuthCallbackHtml({ token: uppyAuthToken }, clientOrigin))
  }
}
