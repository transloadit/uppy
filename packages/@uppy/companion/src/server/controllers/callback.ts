/**
 * oAuth callback.  Encrypts the access token and sends the new token with the response,
 */

import type { NextFunction, Request, Response } from 'express'
import emitter from '../emitter/index.js'
import {
  authCallbackErrorHtml,
  legacyAuthCallbackHtml,
} from '../helpers/html.js'
import * as tokenService from '../helpers/jwt.js'
import * as oAuthState from '../helpers/oauth-state.js'
import logger from '../logger.js'

export default function callback(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const providerName = req.params['providerName']
  const { companion } = req

  if (providerName == null || providerName.length === 0) {
    res.sendStatus(400)
    return
  }
  const secret = req.companion.options.secret

  const grantDynamic = oAuthState.getGrantDynamicFromRequest(req)
  const origin =
    grantDynamic.state &&
    oAuthState.getFromState(grantDynamic.state, 'origin', secret)
  const originString = typeof origin === 'string' ? origin : undefined

  const accessToken = req.session?.grant?.response?.access_token
  const refreshToken = req.session?.grant?.response?.refresh_token

  if (!accessToken) {
    logger.debug(
      `Did not receive access token for provider ${providerName}`,
      undefined,
      req.id,
    )
    logger.debug(req.session?.grant?.response, 'callback.oauth.resp', req.id)
    const authCallbackToken =
      grantDynamic.state &&
      oAuthState.getFromState(
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
      res
        .status(400)
        .send(legacyAuthCallbackHtml({ error: true }, originString))
    }

    return
  }

  const { providerClass } = req.companion
  if (!providerClass) {
    res.sendStatus(400)
    return
  }

  req.companion.providerUserSession = {
    accessToken,
    refreshToken, // might be undefined for some providers
    ...providerClass.grantDynamicToUserSession({ grantDynamic }),
  }

  logger.debug(
    `Generating auth token for provider ${providerName}. refreshToken: ${refreshToken ? 'yes' : 'no'}`,
    undefined,
    req.id,
  )
  const uppyAuthToken = tokenService.generateEncryptedAuthToken(
    { [providerName]: req.companion.providerUserSession },
    secret,
    providerClass.authStateExpiry,
  )

  tokenService.addToCookiesIfNeeded(
    req,
    res,
    uppyAuthToken,
    providerClass.authStateExpiry,
  )

  if (!req.companion.buildURL) {
    res.sendStatus(500)
    return
  }
  res.redirect(
    req.companion.buildURL(
      `/${providerName}/send-token?uppyAuthToken=${uppyAuthToken}`,
      true,
    ),
  )
}
