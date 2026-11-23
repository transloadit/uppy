/**
 * oAuth callback.  Encrypts the access token and sends the new token with the response,
 */

import type { Response } from 'express'

import type { Request } from '../../types/express.js'

import emitter from '../emitter/index.js'
import {
  authCallbackErrorHtml,
  legacyAuthCallbackHtml,
} from '../helpers/html.js'
import * as tokenService from '../helpers/jwt.js'
import * as oAuthState from '../helpers/oauth-state.js'
import logger from '../logger.js'

/**
 * Answer a failed login so the Uppy client waiting on this session's login
 * hears about it. Clients that set an authCallbackToken wait on a socket and
 * close the login window themselves; older ones get a postMessage. Returns
 * false, leaving the response to the caller, when the session has no state
 * of ours.
 */
export function sendLoginFailed(
  req: Request,
  res: Response,
  secret: string | Buffer,
  status = 400,
): boolean {
  const { state } = oAuthState.getGrantDynamicFromRequest(req)
  let decoded: oAuthState.OAuthState | undefined
  try {
    decoded = state ? oAuthState.decodeState(state, secret) : undefined
  } catch {
    // Grant stores a `state` passed to /connect as is, so it can be anything.
    return false
  }
  if (!decoded) return false
  if (decoded.authCallbackToken) {
    emitter().emit(decoded.authCallbackToken, { error: true })
    res.status(status).send(authCallbackErrorHtml())
  } else {
    const { origin } = decoded
    res
      .status(status)
      .send(
        legacyAuthCallbackHtml(
          { error: true },
          typeof origin === 'string' ? origin : undefined,
        ),
      )
  }
  return true
}

export default function callback(req: Request, res: Response): void {
  const providerName = req.params['providerName']

  if (typeof providerName !== 'string' || providerName.length === 0) {
    res.sendStatus(400)
    return
  }
  const secret = req.companion.options.secret

  const grantDynamic = oAuthState.getGrantDynamicFromRequest(req)

  const grant = req.session?.grant
  const response = grant?.response
  // One OAuth response mints one token: a repeated callback must not mint another.
  if (grant) delete grant.response
  // Grant passes an error callback's query through as the response, token fields included.
  const accessToken = response?.error ? undefined : response?.access_token
  const refreshToken = response?.refresh_token

  if (!accessToken) {
    logger.debug(
      `Did not receive access token for provider ${providerName}`,
      undefined,
      req.id,
    )
    logger.debug(response, 'callback.oauth.resp', req.id)
    if (!sendLoginFailed(req, res, secret)) {
      res.status(400).send(legacyAuthCallbackHtml({ error: true }, undefined))
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
  const uppyAuthToken = tokenService.issueAuthToken(
    req,
    res,
    providerName,
    providerClass.authStateExpiry,
  )

  if (!req.companion.buildURL) {
    res.sendStatus(500)
    return
  }
  const sendTokenUrl = req.companion.buildURL(
    `/${providerName}/send-token?uppyAuthToken=${uppyAuthToken}`,
    true,
  )
  // send-token delivers only this token, and only to this session.
  if (grant) grant.pendingAuthToken = uppyAuthToken
  // Save before redirecting, like Grant: express-session sends the headers
  // before its store write finishes, so send-token could miss the token.
  if (typeof req.session?.save === 'function') {
    req.session.save((err) => {
      // send-token may then miss the token; the user can retry the login.
      if (err) logger.error(err, 'callback.session.save.error', req.id)
      res.redirect(sendTokenUrl)
    })
  } else {
    res.redirect(sendTokenUrl)
  }
}
