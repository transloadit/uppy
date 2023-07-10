const { URL } = require('node:url')
const serialize = require('serialize-javascript')

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
          window.opener.postMessage(${serialize({ token })}, ${serialize(origin)})
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

  const state = oAuthState.getDynamicStateFromRequest(req)
  if (state) {
    const origin = oAuthState.getFromState(state, 'origin', req.companion.options.secret)
    const allowedClients = req.companion.options.clients
    // if no preset clients then allow any client
    if (!allowedClients || hasMatch(origin, allowedClients) || hasMatch((new URL(origin)).host, allowedClients)) {
      res.send(htmlContent(uppyAuthToken, origin))
      return
    }
  }
  next()
}
