const serialize = require('serialize-javascript')

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
          if (window.opener != null) {
            window.opener.postMessage(${serialize({ token })}, ${serialize(origin)})
            window.close()
          } else {
            addEventListener("DOMContentLoaded", () => {
              document.body.append(document.createTextNode('Unable to send the authentication token to the web app. This probably means that the web app was served from a HTTP server that includes the \`Cross-Origin-Opener-Policy: same-origin\` header. Make sure that the Uppy app is served from a server that does not send this header, or set to \`same-origin-allow-popups\`.'))
            });
          }
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

  const { state } = oAuthState.getGrantDynamicFromRequest(req)
  if (state) {
    const origin = oAuthState.getFromState(state, 'origin', req.companion.options.secret)
    res.send(htmlContent(uppyAuthToken, origin))
    return
  }
  next()
}
