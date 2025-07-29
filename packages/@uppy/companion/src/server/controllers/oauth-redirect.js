import qs from 'node:querystring'
import { URL } from 'node:url'
import * as oAuthState from '../helpers/oauth-state.js'
import { hasMatch } from '../helpers/utils.js'

/**
 *
 * @param {object} req
 * @param {object} res
 */
export default function oauthRedirect(req, res) {
  const params = qs.stringify(req.query)
  const { oauthProvider } = req.companion.providerClass
  if (!req.companion.options.server.oauthDomain) {
    res.redirect(
      req.companion.buildURL(
        `/connect/${oauthProvider}/callback?${params}`,
        true,
      ),
    )
    return
  }

  const { state } = oAuthState.getGrantDynamicFromRequest(req)
  if (!state) {
    res.status(400).send('Cannot find state in session')
    return
  }
  const handler = oAuthState.getFromState(
    state,
    'companionInstance',
    req.companion.options.secret,
  )
  const handlerHostName = new URL(handler).host

  if (hasMatch(handlerHostName, req.companion.options.server.validHosts)) {
    const url = `${handler}/connect/${oauthProvider}/callback?${params}`
    res.redirect(url)
    return
  }

  res.status(400).send('Invalid Host in state')
}
