import type { NextFunction, Request, Response } from 'express'
import { getRedirectPath, getURLBuilder } from '../helpers/utils.ts'
import * as logger from '../logger.ts'
import box from './box/index.ts'
import { getCredentialsResolver } from './credentials.ts'
import dropbox from './dropbox/index.ts'
import facebook from './facebook/index.ts'
import { Drive } from './google/drive/index.ts'
import instagram from './instagram/graph/index.ts'
import onedrive from './onedrive/index.ts'
import Provider, { isOAuthProvider } from './Provider.ts'
import unsplash from './unsplash/index.ts'
import webdav from './webdav/index.ts'
import zoom from './zoom/index.ts'

type ProviderRegistry = Record<string, typeof Provider>

type GrantConfig = Record<string, Record<string, unknown> | undefined> & {
  defaults?: {
    host?: string
    protocol?: string
    path?: string
  }
}

const validOptions = (options: {
  server?: { host?: unknown; protocol?: unknown }
}): boolean => {
  return (
    typeof options.server?.host === 'string' &&
    options.server.host.length > 0 &&
    typeof options.server.protocol === 'string' &&
    options.server.protocol.length > 0
  )
}

/**
 * adds the desired provider module to the request object,
 * based on the providerName parameter specified
 */
export function getProviderMiddleware(
  providers: ProviderRegistry,
  grantConfig: GrantConfig,
): (req: Request, res: Response, next: NextFunction, providerName: string) => void {
  const middleware = (
    req: Request,
    _res: Response,
    next: NextFunction,
    providerName: string,
  ): void => {
    const ProviderClass = providers[providerName]
    if (ProviderClass && validOptions(req.companion.options)) {
      const { allowLocalUrls, providerOptions } = req.companion.options
      const { oauthProvider } = ProviderClass

      let providerGrantConfig: Record<string, unknown> | undefined
      if (isOAuthProvider(oauthProvider)) {
        req.companion.getProviderCredentials = getCredentialsResolver(
          providerName,
          req.companion.options,
          req,
        )
        providerGrantConfig = grantConfig[oauthProvider] ?? {}
        req.companion.providerGrantConfig = providerGrantConfig
      }

      const secret = providerOptions[providerName]?.secret
      req.companion.provider = new ProviderClass({
        secret,
        providerName,
        providerGrantConfig,
        allowLocalUrls: !!allowLocalUrls,
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
 * Return the default provider implementations.
 */
export function getDefaultProviders(): ProviderRegistry {
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
  } satisfies ProviderRegistry

  return { ...providers }
}

/**
 * Register custom providers and extend Grant config for OAuth-based providers.
 *
 * @param customProviders - Map of provider name -> provider module + Grant config.
 * @param providers - Provider registry to mutate.
 * @param grantConfig - Grant config object to mutate.
 */
export function addCustomProviders(
  customProviders: Record<
    string,
    { module: typeof Provider; config: Record<string, unknown> }
  >,
  providers: ProviderRegistry,
  grantConfig: GrantConfig,
): void {
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
 * @param companionOptions
 * @param grantConfig
 * @param getOauthProvider
 */
export function addProviderOptions(
  companionOptions: {
    server?: {
      host?: string
      protocol?: string
      path?: string
      implicitPath?: string
      oauthDomain?: string
    }
    providerOptions?: Record<
      string,
      { key?: string; secret?: string; credentialsURL?: string } & Record<
        string,
        unknown
      >
    >
  },
  grantConfig: GrantConfig,
  getOauthProvider?: (providerName: string) => string | undefined,
): void {
  const server = companionOptions.server ?? {}
  const providerOptions = companionOptions.providerOptions ?? {}
  if (!validOptions(companionOptions)) {
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
      const grantProviderConfig = grantConfig[oauthProvider]
      // explicitly add providerOptions so users don't override other providerOptions.
      grantProviderConfig.key = providerOptions[providerName].key
      grantProviderConfig.secret = providerOptions[providerName].secret
      if (providerOptions[providerName].credentialsURL) {
        grantProviderConfig.dynamic = [
          'key',
          'secret',
          'redirect_uri',
          'origins',
        ]
      }

      const provider = getDefaultProviders()[providerName]
      if (provider) {
        Object.assign(grantProviderConfig, provider.getExtraGrantConfig())
      }

      // override grant.js redirect uri with companion's custom redirect url
      const isExternal = !!server.implicitPath
      const redirectPath = getRedirectPath(providerName)
      grantProviderConfig.redirect_uri = getURLBuilder(companionOptions)(
        redirectPath,
        isExternal,
      )
      if (oauthDomain) {
        const fullRedirectPath = getURLBuilder(companionOptions)(
          redirectPath,
          isExternal,
          true,
        )
        grantProviderConfig.redirect_uri =
          `${server.protocol}://${oauthDomain}${fullRedirectPath}`
      }

      if (server.implicitPath) {
        // no url builder is used for this because grant internally adds the path
        grantProviderConfig.callback = `${server.implicitPath}${grantProviderConfig.callback}`
      } else if (server.path) {
        grantProviderConfig.callback = `${server.path}${grantProviderConfig.callback}`
      }
    }
  })
}
