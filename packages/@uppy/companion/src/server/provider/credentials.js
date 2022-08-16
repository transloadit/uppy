const got = require('got').default
const atob = require('atob')
const { htmlEscape } = require('escape-goat')
const logger = require('../logger')
const oAuthState = require('../helpers/oauth-state')
const tokenService = require('../helpers/jwt')
// eslint-disable-next-line
const Provider = require('./Provider')

/**
 * @param {string} url
 * @param {string} providerName
 * @param {object|null} credentialRequestParams - null asks for default credentials.
 */
async function fetchKeys (url, providerName, credentialRequestParams) {
  try {
    const { credentials } = await got.post(url, {
      json: { provider: providerName, parameters: credentialRequestParams },
    }).json()

    if (!credentials) throw new Error('Received no remote credentials')
    return credentials
  } catch (err) {
    logger.error(err, 'credentials.fetch.fail')
    throw err
  }
}

/**
 * Fetches for a providers OAuth credentials. If the config for thtat provider allows fetching
 * of the credentials via http, and the `credentialRequestParams` argument is provided, the oauth
 * credentials will be fetched via http. Otherwise, the credentials provided via companion options
 * will be used instead.
 *
 * @param {string} providerName the name of the provider whose oauth keys we want to fetch (e.g onedrive)
 * @param {object} companionOptions the companion options object
 * @param {object} credentialRequestParams the params that should be sent if an http request is required.
 */
async function fetchProviderKeys (providerName, companionOptions, credentialRequestParams) {
  let providerConfig = companionOptions.providerOptions[providerName]
  if (!providerConfig) {
    providerConfig = (companionOptions.customProviders[providerName] || {}).config
  }

  if (!providerConfig) {
    return null
  }

  if (!providerConfig.credentialsURL) {
    return providerConfig
  }

  // If a default key is configured, do not ask the credentials endpoint for it.
  // In a future version we could make this an XOR thing, providing either an endpoint or global keys,
  // but not both.
  if (!credentialRequestParams && providerConfig.key) {
    return providerConfig
  }

  return fetchKeys(providerConfig.credentialsURL, providerName, credentialRequestParams || null)
}

/**
 * Returns a request middleware function that can be used to pre-fetch a provider's
 * Oauth credentials before the request is passed to the Oauth handler (https://github.com/simov/grant in this case).
 *
 * @param {Record<string, typeof Provider>} providers provider classes enabled for this server
 * @param {object} companionOptions companion options object
 * @returns {import('express').RequestHandler}
 */
exports.getCredentialsOverrideMiddleware = (providers, companionOptions) => {
  return (req, res, next) => {
    const { authProvider, override } = req.params
    const [providerName] = Object.keys(providers).filter((name) => providers[name].authProvider === authProvider)
    if (!providerName) {
      next()
      return
    }

    if (!companionOptions.providerOptions[providerName].credentialsURL) {
      next()
      return
    }

    const dynamic = oAuthState.getDynamicStateFromRequest(req)
    // only use state via session object if user isn't making intial "connect" request.
    // override param indicates subsequent requests from the oauth flow
    const state = override ? dynamic : req.query.state
    if (!state) {
      next()
      return
    }

    const preAuthToken = oAuthState.getFromState(state, 'preAuthToken', companionOptions.secret)
    if (!preAuthToken) {
      next()
      return
    }

    const { err, payload } = tokenService.verifyEncryptedToken(preAuthToken, companionOptions.preAuthSecret)
    if (err || !payload) {
      next()
      return
    }

    fetchProviderKeys(providerName, companionOptions, payload).then((credentials) => {
      res.locals.grant = {
        dynamic: {
          key: credentials.key,
          secret: credentials.secret,
        },
      }

      if (credentials.redirect_uri) {
        res.locals.grant.dynamic.redirect_uri = credentials.redirect_uri
      }

      next()
    }).catch((keyErr) => {
      // TODO we should return an html page here that can communicate the error
      // back to the Uppy client, just like /send-token does
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Could not fetch credentials</h1>
          <p>
            This is probably an Uppy configuration issue. Check that your Transloadit key is correct, and that the configured <code>credentialsName</code> for this remote provider matches the name you gave it in the Template Credentials setup on the Transloadit side.
          </p>
          <p>Internal error message: ${htmlEscape(keyErr.message)}</p>
        </body>
        </html>
      `)
    })
  }
}

/**
 * Returns a request scoped function that can be used to get a provider's oauth credentials
 * through out the lifetime of the request.
 *
 * @param {string} providerName the name of the provider attached to the scope of the request
 * @param {object} companionOptions the companion options object
 * @param {object} req the express request object for the said request
 * @returns {(providerName: string, companionOptions: object, credentialRequestParams?: object) => Promise}
 */
module.exports.getCredentialsResolver = (providerName, companionOptions, req) => {
  const credentialsResolver = () => {
    const encodedCredentialsParams = req.header('uppy-credentials-params')
    let credentialRequestParams = null
    if (encodedCredentialsParams) {
      try {
        credentialRequestParams = JSON.parse(atob(encodedCredentialsParams)).params
      } catch (error) {
        logger.error(error, 'credentials.resolve.fail', req.id)
      }
    }

    return fetchProviderKeys(providerName, companionOptions, credentialRequestParams)
  }

  return credentialsResolver
}
