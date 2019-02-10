/**
 * oAuth callback.  Encrypts the access token and sends the new token with the response,
 * and redirects to redirect url.
 */
const tokenService = require('../helpers/jwt')
const parseUrl = require('url').parse
const { hasMatch, sanitizeHtml } = require('../helpers/utils')
const oAuthState = require('../helpers/oauth-state')
const logger = require('../logger')

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = function callback (req, res, next) {
  const providerName = req.params.providerName

  if (!req.uppy.providerTokens) {
    req.uppy.providerTokens = {}
  }

  // TODO see if the access_token can be transported in a different way that url query params
  req.uppy.providerTokens[providerName] = req.query.access_token
  logger.debug(`Generating auth token for provider ${providerName}.`)
  const uppyAuthToken = tokenService.generateToken(req.uppy.providerTokens, req.uppy.options.secret)
  // add the token to cookies for thumbnail/image requests
  tokenService.addToCookies(res, uppyAuthToken, req.uppy.options)

  const state = (req.session.grant || {}).state
  if (state) {
    const origin = oAuthState.getFromState(state, 'origin', req.uppy.options.secret)
    const allowedClients = req.uppy.options.clients
    // if no preset clients then allow any client
    if (!allowedClients || hasMatch(origin, allowedClients) || hasMatch(parseUrl(origin).host, allowedClients)) {
      const redirect = oAuthState.getFromState(state, 'redirect', req.uppy.options.secret)
      if (redirect) {
        // if a redirect value is specified from the client, then redirect there instead
        const query = (parseUrl(redirect).query ? `&` : `?`) + `uppyAuthToken=${uppyAuthToken}`
        return res.redirect(`${redirect}${query}`)
      }
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
          window.opener.postMessage({token: "${token}"}, "${sanitizeHtml(origin)}")
          window.close()
        </script>
    </head>
    <body></body>
    </html>`
}
