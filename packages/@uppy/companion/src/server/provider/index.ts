import type { NextFunction, Request, Response } from 'express'
import type { GrantProviderStaticConfig } from '../../config/grant.js'
import { getRedirectPath, getURLBuilder } from '../helpers/utils.js'
import * as logger from '../logger.js'
import box from './box/index.js'
import { getCredentialsResolver } from './credentials.js'
import dropbox from './dropbox/index.js'
import facebook from './facebook/index.js'
import { Drive } from './google/drive/index.js'
import onedrive from './onedrive/index.js'
import { isOAuthProvider, type ProviderCtor } from './Provider.js'
import unsplash from './unsplash/index.js'
import webdav from './webdav/index.js'
import zoom from './zoom/index.js'

export interface GrantConfigDefaults {
  host?: string
  protocol?: string
  path?: string
}

export interface GrantProviderConfig
  extends GrantProviderStaticConfig,
    GrantConfigDefaults {
  key?: string | undefined
  secret?: string | undefined
  dynamic?: string[]
  redirect_uri?: string | undefined
}

export interface GrantConfig {
  defaults?: GrantConfigDefaults
  // keyed per provider:
  [key: string]: GrantProviderConfig | undefined
}

/**
 * adds the desired provider module to the request object,
 * based on the providerName parameter specified
 */
export function getProviderMiddleware(
  providers: Record<string, ProviderCtor>,
  grantConfig: GrantConfig,
): (
  req: Request,
  res: Response,
  next: NextFunction,
  providerName: string,
) => void {
  const middleware = (
    req: Request,
    _res: Response,
    next: NextFunction,
    providerName: string,
  ): void => {
    const ProviderClass = providers[providerName]
    if (
      !ProviderClass ||
      !(
        req.companion.options.server.host &&
        req.companion.options.server.protocol
      )
    ) {
      logger.warn(
        'invalid provider options detected. Provider will not be loaded',
        'provider.middleware.invalid',
        req.id,
      )
      return
    }

    const { allowLocalUrls, providerOptions } = req.companion.options
    const { oauthProvider } = ProviderClass

    let providerGrantConfig: GrantProviderConfig | undefined
    if (isOAuthProvider(oauthProvider)) {
      req.companion.getProviderCredentials = getCredentialsResolver(
        providerName,
        req.companion.options,
        req,
      )

      providerGrantConfig = grantConfig[oauthProvider]
      req.companion.providerGrantConfig = providerGrantConfig ?? {}
    }

    const secret = providerOptions[providerName]?.secret

    const providerArgs = {
      secret,
      providerName,
      allowLocalUrls,
      ...(providerGrantConfig && { providerGrantConfig }),
    }
    req.companion.provider = new ProviderClass(providerArgs)
    req.companion.providerName = providerName
    req.companion.providerClass = ProviderClass
    next()
  }

  return middleware
}

/**
 * Return the default provider implementations.
 */
export function getDefaultProviders() {
  return {
    dropbox,
    box,
    drive: Drive,
    facebook,
    onedrive,
    zoom,
    unsplash,
    webdav,
  }
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
    { module: ProviderCtor; config: GrantProviderConfig }
  >,
  providers: Record<string, ProviderCtor>,
  grantConfig: GrantConfig,
): void {
  Object.entries(customProviders).forEach(([providerName, customProvider]) => {
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

export function addProviderOptions(
  companionOptions: {
    server?: {
      host?: string | undefined
      protocol?: string | undefined
      path?: string | undefined
      implicitPath?: string | undefined
      oauthDomain?: string | undefined
    }
    providerOptions?: Record<
      string,
      {
        key?: string | undefined
        secret?: string | undefined
        credentialsURL?: string | undefined
      }
    >
  },
  grantConfig: GrantConfig,
  getOauthProvider?: (providerName: string) => string | undefined,
): void {
  const server = companionOptions.server ?? {}
  const providerOptions = companionOptions.providerOptions ?? {}
  const host = server.host
  const protocol = server.protocol
  if (!(host && protocol)) {
    logger.warn(
      'invalid provider options detected. Provider will not be loaded',
      'provider.options.invalid',
    )
    return
  }

  grantConfig.defaults = {
    host,
    protocol,
    ...(server.path != null && { path: server.path }),
  }

  const { oauthDomain } = server
  const keys = Object.keys(providerOptions).filter((key) => key !== 'server')
  keys.forEach((providerName) => {
    const oauthProvider = getOauthProvider?.(providerName)

    if (isOAuthProvider(oauthProvider) && grantConfig[oauthProvider]) {
      const grantProviderConfig = grantConfig[oauthProvider]
      const providerOption = providerOptions[providerName]
      if (!providerOption) return
      // explicitly add providerOptions so users don't override other providerOptions.
      grantProviderConfig['key'] = providerOption.key
      grantProviderConfig['secret'] = providerOption.secret
      if (providerOption.credentialsURL) {
        grantProviderConfig['dynamic'] = [
          'key',
          'secret',
          'redirect_uri',
          'origins',
        ]
      }

      const provider =
        getDefaultProviders()[
          providerName as keyof ReturnType<typeof getDefaultProviders>
        ]
      if (provider) {
        Object.assign(grantProviderConfig, provider.getExtraGrantConfig())
      }

      // override grant.js redirect uri with companion's custom redirect url
      const isExternal = !!server.implicitPath
      const redirectPath = getRedirectPath(providerName)
      grantProviderConfig['redirect_uri'] = getURLBuilder(companionOptions)(
        redirectPath,
        isExternal,
      )
      if (oauthDomain) {
        const fullRedirectPath = getURLBuilder(companionOptions)(
          redirectPath,
          isExternal,
          true,
        )
        grantProviderConfig['redirect_uri'] =
          `${protocol}://${oauthDomain}${fullRedirectPath}`
      }

      if (server.implicitPath) {
        // no url builder is used for this because grant internally adds the path
        const cb = grantProviderConfig['callback']
        if (typeof cb === 'string') {
          grantProviderConfig['callback'] = `${server.implicitPath}${cb}`
        }
      } else if (server.path) {
        const cb = grantProviderConfig['callback']
        if (typeof cb === 'string') {
          grantProviderConfig['callback'] = `${server.path}${cb}`
        }
      }
    }
  })
}
