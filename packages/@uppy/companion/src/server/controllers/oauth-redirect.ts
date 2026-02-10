import qs from 'node:querystring'
import { URL } from 'node:url'
import type { Request, Response } from 'express'
import * as oAuthState from '../helpers/oauth-state.js'
import { hasMatch } from '../helpers/utils.js'

export default function oauthRedirect(req: Request, res: Response): void {
  const secret = req.companion.options.secret
  if (typeof secret !== 'string' && !Buffer.isBuffer(secret)) {
    res.sendStatus(500)
    return
  }
  const queryParams: Record<string, string | readonly string[]> = {}
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') {
      queryParams[key] = value
      continue
    }
    if (Array.isArray(value) && value.every((i) => typeof i === 'string')) {
      queryParams[key] = value
    }
  }
  const params = qs.stringify(queryParams)
  const { providerClass, buildURL } = req.companion
  const oauthProvider = providerClass?.oauthProvider
  if (typeof oauthProvider !== 'string' || oauthProvider.length === 0) {
    res.sendStatus(400)
    return
  }
  if (!buildURL) {
    res.sendStatus(500)
    return
  }
  if (!req.companion.options.server.oauthDomain) {
    res.redirect(buildURL(`/connect/${oauthProvider}/callback?${params}`, true))
    return
  }

  const { state } = oAuthState.getGrantDynamicFromRequest(req)
  if (!state) {
    res.status(400).send('Cannot find state in session')
    return
  }
  const handler = oAuthState.getFromState(state, 'companionInstance', secret)
  if (typeof handler !== 'string' || handler.length === 0) {
    res.status(400).send('Invalid Host in state')
    return
  }
  let handlerHostName: string
  try {
    handlerHostName = new URL(handler).host
  } catch {
    res.status(400).send('Invalid Host in state')
    return
  }

  if (hasMatch(handlerHostName, req.companion.options.server.validHosts)) {
    const url = `${handler}/connect/${oauthProvider}/callback?${params}`
    res.redirect(url)
    return
  }

  res.status(400).send('Invalid Host in state')
}
