import type { NextFunction, Request, Response } from 'express'
import type { ProviderGrantConfig } from '../../types/express.js'
import { getRedirectPath, getURLBuilder } from '../helpers/utils.ts'
import * as logger from '../logger.ts'
import box from './box/index.ts'
import { getCredentialsResolver } from './credentials.ts'
import dropbox from './dropbox/index.ts'
import facebook from './facebook/index.ts'
import { Drive } from './google/drive/index.ts'
import instagram from './instagram/graph/index.ts'
import onedrive from './onedrive/index.ts'
import { isOAuthProvider, type ProviderCtor } from './Provider.ts'
import unsplash from './unsplash/index.ts'
import webdav from './webdav/index.ts'
import zoom from './zoom/index.ts'

type GrantConfig = {
  defaults?: {
    host?: string
    protocol?: string
    path?: string
  }
  [key: string]: Record<string, unknown> | undefined
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

    let providerGrantConfig: ProviderGrantConfig | undefined
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
    instagram,
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
    { module: ProviderCtor; config: Record<string, unknown> }
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
