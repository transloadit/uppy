import { timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { publishAuthCallback } from '../auth-callback.js'
import {
  authCallbackSuccessHtml,
  legacyAuthCallbackHtml,
} from '../helpers/html.js'
import * as oAuthState from '../helpers/oauth-state.js'
import { isOriginAllowed } from './connect.js'

export default async function sendToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const companion = req.companion
  const uppyAuthToken = companion.authToken
  const { secret } = companion.options

  // Only the token this session's own OAuth callback minted, and only once.
  const grant = req.session?.grant
  const pending = Buffer.from(grant?.pendingAuthToken ?? '')
  const given = Buffer.from(uppyAuthToken ?? '')
  if (
    pending.length === 0 ||
    pending.length !== given.length ||
    !timingSafeEqual(pending, given)
  ) {
    next()
    return
  }
  delete grant?.pendingAuthToken

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
    await publishAuthCallback(
      authCallbackToken,
      { token: uppyAuthToken },
      companion.options,
    )
    res.send(authCallbackSuccessHtml())
  } else {
    // postMessage() delivers to the scheme://host:port of its target origin, so
    // that must be all the state holds (a trailing slash aside), not a longer
    // string that matched corsOrigins. A configured corsOrigins string lands
    // here as written, so its case and an explicit default port are kept.
    if (!/^[a-z][a-z\d+.-]*:\/\/[^/?#@\\]+\/?$/i.test(clientOrigin)) {
      next()
      return
    }
    // This is backwards compatible with old Uppy clients:
    res.send(
      legacyAuthCallbackHtml(
        { token: uppyAuthToken },
        clientOrigin.replace(/\/$/, ''),
      ),
    )
  }
}
