import serialize from 'serialize-javascript'
import type { NextFunction, Request, Response } from 'express'
import * as oAuthState from '../helpers/oauth-state.js'
import { isOriginAllowed } from './connect.js'

const htmlContent = (token: string, origin: string): string => {
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

export default function sendToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const companion = req.companion
  const uppyAuthToken = companion.authToken
  const secret = companion.options.secret
  if (typeof secret !== 'string' && !Buffer.isBuffer(secret)) {
    next()
    return
  }

  const { state } = oAuthState.getGrantDynamicFromRequest(req)

  if (!state) {
    next()
    return
  }

  const clientOrigin = oAuthState.getFromState(
    state,
    'origin',
    secret,
  )
  if (typeof clientOrigin !== 'string' || clientOrigin.length === 0) {
    next()
    return
  }
  const customerDefinedAllowedOrigins = oAuthState.getFromState(
    state,
    'customerDefinedAllowedOrigins',
    secret,
  )

  if (
    customerDefinedAllowedOrigins &&
    !isOriginAllowed(clientOrigin, customerDefinedAllowedOrigins)
  ) {
    next()
    return
  }

  res.send(htmlContent(`${uppyAuthToken}`, clientOrigin))
}
