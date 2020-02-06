/**
 *
 * sends auth token to uppy client
 */
const tokenService = require('../helpers/jwt')
const parseUrl = require('url').parse // eslint-disable-line node/no-deprecated-api
const { hasMatch, sanitizeHtml } = require('../helpers/utils')
const oAuthState = require('../helpers/oauth-state')
const versionCmp = require('../helpers/version')

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = function sendToken (req, res, next) {
  const uppyAuthToken = req.companion.authToken
  // some providers need the token in cookies for thumbnail/image requests
  if (req.companion.provider.needsCookieAuth) {
    tokenService.addToCookies(res, uppyAuthToken, req.companion.options, req.companion.provider.authProvider)
  }

  const dynamic = (req.session.grant || {}).dynamic || {}
  const state = dynamic.state
  if (state) {
    const origin = oAuthState.getFromState(state, 'origin', req.companion.options.secret)
    const clientVersion = oAuthState.getFromState(
      state,
      'clientVersion',
      req.companion.options.secret
    )
    const allowedClients = req.companion.options.clients
    // if no preset clients then allow any client
    if (!allowedClients || hasMatch(origin, allowedClients) || hasMatch(parseUrl(origin).host, allowedClients)) {
      const allowsStringMessage = versionCmp.gte(clientVersion, '1.0.2')
      return res.send(allowsStringMessage ? htmlContent(uppyAuthToken, origin) : oldHtmlContent(uppyAuthToken, origin))
    }
  }
  next()
}

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
          window.opener.postMessage(JSON.stringify({token: "${token}"}), "${sanitizeHtml(origin)}")
          window.close()
        </script>
    </head>
    <body></body>
    </html>`
}

/**
 * @todo remove this function in next major release
 * @param {string} token uppy auth token
 * @param {string} origin url string
 */
const oldHtmlContent = (token, origin) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <script>
          window.opener.postMessage({token: "${token}"}, "${sanitizeHtml(origin)}")
          window.close()
        </script>
    </head>
    <body></body>
    </html>`
}
