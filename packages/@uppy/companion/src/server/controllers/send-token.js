import serialize from 'serialize-javascript'
import * as oAuthState from '../helpers/oauth-state.js'
import { isOriginAllowed } from './connect.js'

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
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export default function sendToken(req, res, next) {
  // @ts-expect-error untyped
  const { companion } = req
  const uppyAuthToken = companion.authToken

  const { state } = oAuthState.getGrantDynamicFromRequest(req)

  if (!state) {
    return next()
  }

  const clientOrigin = oAuthState.getFromState(
    state,
    'origin',
    companion.options.secret,
  )
  const customerDefinedAllowedOrigins = oAuthState.getFromState(
    state,
    'customerDefinedAllowedOrigins',
    companion.options.secret,
  )

  if (
    customerDefinedAllowedOrigins &&
    !isOriginAllowed(clientOrigin, customerDefinedAllowedOrigins)
  ) {
    return next()
  }

  return res.send(htmlContent(uppyAuthToken, clientOrigin))
}
