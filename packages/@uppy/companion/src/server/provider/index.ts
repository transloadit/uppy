/**
 * @module provider
 */

import { getRedirectPath, getURLBuilder } from '../helpers/utils.js'
import * as logger from '../logger.js'
import box from './box/index.js'
import { getCredentialsResolver } from './credentials.js'
import dropbox from './dropbox/index.js'
import facebook from './facebook/index.js'
import { Drive } from './google/drive/index.js'
import instagram from './instagram/graph/index.js'
import onedrive from './onedrive/index.js'
// biome-ignore lint/correctness/noUnusedImports: It's used as a type
import Provider, { isOAuthProvider } from './Provider.js'
import unsplash from './unsplash/index.js'
import webdav from './webdav/index.js'
import zoom from './zoom/index.js'

/**
 *
 * @param {{server: object}} options
 */
const validOptions = (options) => {
  return options.server.host && options.server.protocol
}

/**
 * adds the desired provider module to the request object,
 * based on the providerName parameter specified
 *
 * @param {Record<string, typeof Provider>} providers
 */
export function getProviderMiddleware(providers, grantConfig) {
  /**
   *
   * @param {object} req
   * @param {object} res
   * @param {Function} next
   * @param {string} providerName
   */
  const middleware = (req, res, next, providerName) => {
    const ProviderClass = providers[providerName]
    if (ProviderClass && validOptions(req.companion.options)) {
      const { allowLocalUrls, providerOptions } = req.companion.options
      const { oauthProvider } = ProviderClass

      let providerGrantConfig
      if (isOAuthProvider(oauthProvider)) {
        req.companion.getProviderCredentials = getCredentialsResolver(
          providerName,
          req.companion.options,
          req,
        )
        providerGrantConfig = grantConfig[oauthProvider]
        req.companion.providerGrantConfig = providerGrantConfig
      }

      const secret = providerOptions[providerName]?.secret
      req.companion.provider = new ProviderClass({
        secret,
        providerName,
        providerGrantConfig,
        allowLocalUrls,
      })
      req.companion.providerName = providerName
      req.companion.providerClass = ProviderClass
    } else {
      logger.warn(
        'invalid provider options detected. Provider will not be loaded',
        'provider.middleware.invalid',
        req.id,
      )
    }
    next()
  }

  return middleware
}

/**
 * @returns {Record<string, typeof Provider>}
 */
export function getDefaultProviders() {
  const providers = {
    dropbox,
    box,
    drive: Drive,
    facebook,
    onedrive,
    zoom,
    instagram,
    unsplash,
    webdav,
  }

  return providers
}

/**
 *
 * @typedef {{'module': typeof Provider, config: Record<string,unknown>}} CustomProvider
 *
 * @param {Record<string, CustomProvider>} customProviders
 * @param {Record<string, typeof Provider>} providers
 * @param {object} grantConfig
 */
export function addCustomProviders(customProviders, providers, grantConfig) {
  Object.keys(customProviders).forEach((providerName) => {
    const customProvider = customProviders[providerName]

    providers[providerName] = customProvider.module
    const { oauthProvider } = customProvider.module

    if (isOAuthProvider(oauthProvider)) {
      grantConfig[oauthProvider] = {
        ...customProvider.config,
        // todo: consider setting these options from a universal point also used
        // by official providers. It'll prevent these from getting left out if the
        // requirement changes.
        callback: `/${providerName}/callback`,
        transport: 'session',
      }
    }
  })
}

/**
 *
 * @param {{server: object, providerOptions: object}} companionOptions
 * @param {object} grantConfig
 * @param {(a: string) => string} getOauthProvider
 */
export function addProviderOptions(
  companionOptions,
  grantConfig,
  getOauthProvider,
) {
  const { server, providerOptions } = companionOptions
  if (!validOptions({ server })) {
    logger.warn(
      'invalid provider options detected. Providers will not be loaded',
      'provider.options.invalid',
    )
    return
  }

  grantConfig.defaults = {
    host: server.host,
    protocol: server.protocol,
    path: server.path,
  }

  const { oauthDomain } = server
  const keys = Object.keys(providerOptions).filter((key) => key !== 'server')
  keys.forEach((providerName) => {
    const oauthProvider = getOauthProvider?.(providerName)

    if (isOAuthProvider(oauthProvider) && grantConfig[oauthProvider]) {
      // explicitly add providerOptions so users don't override other providerOptions.
      grantConfig[oauthProvider].key = providerOptions[providerName].key
      grantConfig[oauthProvider].secret = providerOptions[providerName].secret
      if (providerOptions[providerName].credentialsURL) {
        grantConfig[oauthProvider].dynamic = [
          'key',
          'secret',
          'redirect_uri',
          'origins',
        ]
      }

      const provider = getDefaultProviders()[providerName]
      Object.assign(grantConfig[oauthProvider], provider.getExtraGrantConfig())

      // override grant.js redirect uri with companion's custom redirect url
      const isExternal = !!server.implicitPath
      const redirectPath = getRedirectPath(providerName)
      grantConfig[oauthProvider].redirect_uri = getURLBuilder(companionOptions)(
        redirectPath,
        isExternal,
      )
      if (oauthDomain) {
        const fullRedirectPath = getURLBuilder(companionOptions)(
          redirectPath,
          isExternal,
          true,
        )
        grantConfig[oauthProvider].redirect_uri =
          `${server.protocol}://${oauthDomain}${fullRedirectPath}`
      }

      if (server.implicitPath) {
        // no url builder is used for this because grant internally adds the path
        grantConfig[oauthProvider].callback =
          `${server.implicitPath}${grantConfig[oauthProvider].callback}`
      } else if (server.path) {
        grantConfig[oauthProvider].callback =
          `${server.path}${grantConfig[oauthProvider].callback}`
      }
    }
  })
}
