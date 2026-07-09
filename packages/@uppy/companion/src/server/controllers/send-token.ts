import type { NextFunction, Request, Response } from 'express'
import emitter from '../emitter/index.js'
import {
  authCallbackSuccessHtml,
  legacyAuthCallbackHtml,
} from '../helpers/html.js'
import * as oAuthState from '../helpers/oauth-state.js'
import { isOriginAllowed } from './connect.js'

export default function sendToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const companion = req.companion
  const uppyAuthToken = companion.authToken
  const { secret } = companion.options

  const { state } = oAuthState.getGrantDynamicFromRequest(req)
  if (!state) {
    next()
    return
  }

  const clientOrigin = oAuthState.getFromState(state, 'origin', secret)
  if (typeof clientOrigin !== 'string' || clientOrigin.length === 0) {
    next()
    return
  }
  const customerDefinedAllowedOrigins = oAuthState.getFromState(
    state,
    'customerDefinedAllowedOrigins',
    secret,
  )

  if (
    customerDefinedAllowedOrigins &&
    !isOriginAllowed(clientOrigin, customerDefinedAllowedOrigins)
  ) {
    next()
    return
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
