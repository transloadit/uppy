const { URL } = require('node:url')
const serialize = require('serialize-javascript')
const emitter = require('../emitter')
const logger = require('../logger')
const tokenService = require('../helpers/jwt')
const { hasMatch } = require('../helpers/utils')
const oAuthState = require('../helpers/oauth-state')

/**
 *
 * @param {string} token uppy auth token
 * @param {string} origin url string
 */
const htmlContent = (token, origin) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <script>
          if (window.opener) window.opener.postMessage(${serialize({ token })}, ${serialize(origin)})
          window.close()
        </script>
    </head>
    <body></body>
    </html>`
}

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
module.exports = function sendToken (req, res, next) {
  const uppyAuthToken = req.companion.authToken
  // some providers need the token in cookies for thumbnail/image requests
  if (req.companion.provider.needsCookieAuth) {
    tokenService.addToCookies(res, uppyAuthToken, req.companion.options, req.companion.provider.authProvider)
  }

  const state = oAuthState.getDynamicStateFromRequest(req)

  if (state) {
    const origin = oAuthState.getFromState(state, 'origin', req.companion.options.secret)
    const token = oAuthState.getFromState(state, 'callbackToken', req.companion.options.secret)
    logger.debug('callbackToken', token, `:  sending ${uppyAuthToken}`)
    emitter().emit(token, { action: 'token', payload: { token: uppyAuthToken, origin } })
    const allowedClients = req.companion.options.clients
    // if no preset clients then allow any client
    if (!allowedClients || hasMatch(origin, allowedClients) || hasMatch((new URL(origin)).host, allowedClients)) {
      return res.send(htmlContent(uppyAuthToken, origin))
    }
  }
  next()
}
