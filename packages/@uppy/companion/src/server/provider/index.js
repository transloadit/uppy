/**
 * @module provider
 */
// @ts-ignore
const config = require('@purest/providers')
const dropbox = require('./dropbox')
const drive = require('./drive')
const instagram = require('./instagram')
const { getURLBuilder } = require('../helpers/utils')
const logger = require('../logger')

/**
 * Provider interface defines the specifications of any provider implementation
 *
 * @interface
 */
class Provider {
  /**
   *
   * @param {object} options
   */
  constructor (options) {
    return this
  }
  /**
   *
   * @param {object} options
   * @param {function} cb
   */
  list (options, cb) {}

  /**
   *
   * @param {object} options
   * @param {function} cb
   */
  download (options, cb) {}

  /**
   *
   * @param {object} options
   * @param {function} cb
   */
  thumbnail (options, cb) {}

  /**
   *
   * @param {object} options
   * @param {function} cb
   */
  size (options, cb) {}

  /**
   * @returns {string}
   */
  static get authProvider () {
    return ''
  }
}

module.exports.ProviderInterface = Provider

/**
 * adds the desired provider module to the request object,
 * based on the providerName parameter specified
 *
 * @param {Object.<string, typeof Provider>} providers
 */
module.exports.getProviderMiddleware = (providers) => {
  /**
   *
   * @param {object} req
   * @param {object} res
   * @param {function} next
   * @param {string} providerName
   */
  const middleware = (req, res, next, providerName) => {
    if (providers[providerName] && validOptions(req.uppy.options)) {
      req.uppy.provider = new providers[providerName]({ providerName, config })
    } else {
      logger.warn('invalid provider options detected. Provider will not be loaded', 'provider.middleware.invalid', req.id)
    }
    next()
  }

  return middleware
}

/**
 * @return {Object.<string, typeof Provider>}
 */
module.exports.getDefaultProviders = () => {
  return { dropbox, drive, instagram }
}

/**
 *
 * @typedef {{module: typeof Provider, config: object}} CustomProvider
 *
 * @param {Object.<string, CustomProvider>} customProviders
 * @param {Object.<string, typeof Provider>} providers
 * @param {object} grantConfig
 */
module.exports.addCustomProviders = (customProviders, providers, grantConfig) => {
  Object.keys(customProviders).forEach((providerName) => {
    providers[providerName] = customProviders[providerName].module
    grantConfig[providerName] = customProviders[providerName].config
  })
}

/**
 *
 * @param {{server: object, providerOptions: object}} options
 * @param {object} grantConfig
 */
module.exports.addProviderOptions = (options, grantConfig) => {
  const { server, providerOptions } = options
  if (!validOptions({ server })) {
    logger.warn('invalid provider options detected. Providers will not be loaded', 'provider.options.invalid')
    return
  }

  grantConfig.server = {
    host: server.host,
    protocol: server.protocol,
    path: server.path
  }

  const { oauthDomain } = server
  const keys = Object.keys(providerOptions).filter((key) => key !== 'server')
  keys.forEach((authProvider) => {
    if (grantConfig[authProvider]) {
      // explicitly add providerOptions so users don't override other providerOptions.
      grantConfig[authProvider].key = providerOptions[authProvider].key
      grantConfig[authProvider].secret = providerOptions[authProvider].secret

      // override grant.js redirect uri with uppy's custom redirect url
      if (oauthDomain) {
        const providerName = authToProviderName(authProvider)
        const redirectPath = `/${providerName}/redirect`
        const isExternal = !!server.implicitPath
        const fullRedirectPath = getURLBuilder(options)(redirectPath, isExternal, true)
        grantConfig[authProvider].redirect_uri = `${server.protocol}://${oauthDomain}${fullRedirectPath}`
      }

      if (server.implicitPath) {
        // no url builder is used for this because grant internally adds the path
        grantConfig[authProvider].callback = `${server.implicitPath}${grantConfig[authProvider].callback}`
      } else if (server.path) {
        grantConfig[authProvider].callback = `${server.path}${grantConfig[authProvider].callback}`
      }
    } else if (authProvider !== 's3') {
      logger.warn(`skipping one found unsupported provider "${authProvider}".`, 'provider.options.skip')
    }
  })
}

/**
 *
 * @param {string} authProvider
 */
const authToProviderName = (authProvider) => {
  const providers = exports.getDefaultProviders()
  const providerNames = Object.keys(providers)
  for (const name of providerNames) {
    const provider = providers[name]
    if (provider.authProvider === authProvider) {
      return name
    }
  }
}

/**
 *
 * @param {{server: object}} options
 */
const validOptions = (options) => {
  return options.server.host && options.server.protocol
}
