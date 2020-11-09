const request = require('request')
// @ts-ignore
const atob = require('atob')
const logger = require('../logger')
const oAuthState = require('../helpers/oauth-state')
const tokenService = require('../helpers/jwt')

exports.getCredentialsOverrideMiddleware = (providers, companionOptions) => {
  return (req, res, next) => {
    const { authProvider } = req.params
    const [providerName] = Object.keys(providers).filter((name) => providers[name].authProvider === authProvider)
    if (!providerName) {
      return next()
    }

    if (!companionOptions.providerOptions[providerName].credentialsURL) {
      return next()
    }

    const dynamic = (req.session.grant || {}).dynamic || {}
    const state = dynamic.state || req.query.state
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

    module.exports.fetchProviderKeys(providerName, companionOptions, payload).then((credentials) => {
      res.locals.grant = {
        dynamic: {
          key: credentials.key,
          secret: credentials.secret
        }
      }

      if (credentials.redirect_uri) {
        res.locals.grant.dynamic.redirect_uri = credentials.redirect_uri
      }
    }).finally(() => next())
  }
}

module.exports.getCredentialsResolver = (providerName, companionOptions, req) => {
  const credentialsResolver = () => {
    const encodedCredentialsParams = req.header('uppy-credentials-params')
    let credentialRequestParams = null
    if (encodedCredentialsParams) {
      try {
        credentialRequestParams = JSON.parse(atob(encodedCredentialsParams)).params
      } catch (error) {
        logger.error(error, 'credentilas.resolve.fail', req.id)
      }
    }

    return module.exports.fetchProviderKeys(providerName, companionOptions, credentialRequestParams)
  }

  return credentialsResolver
}

module.exports.fetchProviderKeys = (providerName, companionOptions, credentialRequestParams) => {
  let providerConfig = companionOptions.providerOptions[providerName]
  if (!providerConfig) {
    providerConfig = (companionOptions.customProviders[providerName] || {}).config
  }

  if (providerConfig && providerConfig.credentialsURL && credentialRequestParams) {
    return fetchKeys(providerConfig.credentialsURL, providerName, credentialRequestParams)
  } else {
    return Promise.resolve(providerConfig)
  }
}

const fetchKeys = (url, providerName, credentialRequestParams) => {
  return new Promise((resolve, reject) => {
    const options = {
      body: {
        provider: providerName,
        params: credentialRequestParams
      },
      json: true
    }
    request.post(url, options, (err, resp, body) => {
      if (err) {
        logger.error(err, 'credentials.fetch.fail')
        return reject(err)
      }

      if (resp.statusCode !== 200 || !body.credentials) {
        const err = new Error(`recevied status: ${resp.statusCode} with no credentials`)
        logger.error(err, 'credentials.fetch.fail')
        return reject(err)
      }

      return resolve(body.credentials)
    })
  })
}
