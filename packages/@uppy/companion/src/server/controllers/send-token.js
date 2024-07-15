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
          (function() {
            'use strict';

            var data = ${serialize({ token })};
            var origin = ${serialize(origin)};

            if (window.opener != null) {
              window.opener.postMessage(data, origin);
              window.close();
            } else {
              // maybe this will work? (note that it's not possible to try/catch this to see whether it worked)
              window.postMessage(data, origin);

              console.warn('Unable to send the authentication token to the web app. This probably means that the web app was served from a HTTP server that includes the \`Cross-Origin-Opener-Policy: same-origin\` header. Make sure that the Uppy app is served from a server that does not send this header, or set to \`same-origin-allow-popups\`.');

              addEventListener("DOMContentLoaded", function() {
                document.body.appendChild(document.createTextNode('Something went wrong. Please contact the site administrator. You may now exit this page.'));
              });
            }
          })();
        </script>
    </head>
    <body>
    <noscript>
      JavaScript must be enabled for this to work.
    </noscript>
    </body>
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
