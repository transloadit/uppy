const request = require('request')
// @ts-ignore
const atob = require('atob')
const logger = require('../logger')
const oAuthState = require('../helpers/oauth-state')
const tokenService = require('../helpers/jwt')
// eslint-disable-next-line
const Provider = require('./Provider')

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
      return next()
    }

    if (!companionOptions.providerOptions[providerName].credentialsURL) {
      return next()
    }

    const dynamic = oAuthState.getDynamicStateFromRequest(req)
    // only use state via session object if user isn't making intial "connect" request.
    // override param indicates subsequent requests from the oauth flow
    const state = override ? dynamic : req.query.state
    if (!state) {
      return next()
    }

    const preAuthToken = oAuthState.getFromState(state, 'preAuthToken', companionOptions.secret)
    if (!preAuthToken) {
      return next()
    }

    const { err, payload } = tokenService.verifyEncryptedToken(preAuthToken, companionOptions.preAuthSecret)
    if (err || !payload) {
      return next()
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
    }).catch((err) => {
      // TODO we should return an html page here that can communicate the error
      // back to the Uppy client
      next(err)
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
const fetchProviderKeys = (providerName, companionOptions, credentialRequestParams) => {
  let providerConfig = companionOptions.providerOptions[providerName]
  if (!providerConfig) {
    providerConfig = (companionOptions.customProviders[providerName] || {}).config
  }

  if (providerConfig && providerConfig.credentialsURL && credentialRequestParams) {
    return fetchKeys(providerConfig.credentialsURL, providerName, credentialRequestParams)
  }
  return Promise.resolve(providerConfig)
}

const fetchKeys = (url, providerName, credentialRequestParams) => {
  return new Promise((resolve, reject) => {
    const options = {
      body: {
        provider: providerName,
        parameters: credentialRequestParams,
      },
      json: true,
    }
    request.post(url, options, (err, resp, body) => {
      if (err) {
        logger.error(err, 'credentials.fetch.fail')
        return reject(err)
      }

      if (resp.statusCode !== 200 || !body.credentials) {
        const err = new Error(`received status: ${resp.statusCode} with no credentials`)
        logger.error(err, 'credentials.fetch.fail')
        return reject(err)
      }

      return resolve(body.credentials)
    })
  })
}
