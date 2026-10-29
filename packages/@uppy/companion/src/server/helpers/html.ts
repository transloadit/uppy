import serialize from 'serialize-javascript'

export const authCallbackSuccessHtml = () => {
  // Uppy closes this popup after receiving the callback token. Closing here
  // trips its cancellation poll while a late socket is still subscribing.
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
    </head>
    <body>
      <center>Authentication successful. Please wait for this page to close automatically. If it stays open for more than a minute, close it and try signing in again.</center>
    </body>
    </html>`
}

export const authCallbackErrorHtml = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <script>
          (function() {
            'use strict';

            document.addEventListener('DOMContentLoaded', function () {
              window.close();
            });
          })();
        </script>
    </head>
    <body>
      <center>Authentication failed. You may now close this page.</center>
    </body>
    </html>`
}

/**
 * Generate an HTML page that will post a message to the opener window and then close itself.
 * This is only used by old Uppy clients
 *
 * @param {unknown} data data payload
 * @param {string} origin url string
 */
export const legacyAuthCallbackHtml = (
  data: unknown,
  origin: string | undefined,
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <script>
          (function() {
            'use strict';

            var data = ${serialize(data)};
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
