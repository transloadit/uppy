/**
 *
 * sends auth token to uppy client
 */
const tokenService = require('../helpers/jwt')
const parseUrl = require('url').parse
const { hasMatch, sanitizeHtml } = require('../helpers/utils')
const oAuthState = require('../helpers/oauth-state')

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = function sendToken (req, res, next) {
  const uppyAuthToken = req.uppy.authToken
  // add the token to cookies for thumbnail/image requests
  tokenService.addToCookies(res, uppyAuthToken, req.uppy.options, req.uppy.provider.authProvider)

  const state = (req.session.grant || {}).state
  if (state) {
    const origin = oAuthState.getFromState(state, 'origin', req.uppy.options.secret)
    const allowedClients = req.uppy.options.clients
    // if no preset clients then allow any client
    if (!allowedClients || hasMatch(origin, allowedClients) || hasMatch(parseUrl(origin).host, allowedClients)) {
      return res.send(htmlContent(uppyAuthToken, origin))
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
