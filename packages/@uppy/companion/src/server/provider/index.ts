import type { NextFunction, Request, Response } from 'express'
import { getRedirectPath, getURLBuilder } from '../helpers/utils.ts'
import { isRecord } from '../helpers/type-guards.ts'
import * as logger from '../logger.ts'
import box from './box/index.ts'
import { getCredentialsResolver } from './credentials.ts'
import dropbox from './dropbox/index.ts'
import facebook from './facebook/index.ts'
import { Drive } from './google/drive/index.ts'
import instagram from './instagram/graph/index.ts'
import onedrive from './onedrive/index.ts'
import { isOAuthProvider } from './Provider.ts'
import unsplash from './unsplash/index.ts'
import webdav from './webdav/index.ts'
import zoom from './zoom/index.ts'

type ProviderCtor = typeof import('./Provider.ts').default

type ProviderRegistry = Record<string, ProviderCtor>

type GrantConfig = Record<string, Record<string, unknown> | undefined> & {
  defaults?: {
    host?: string
    protocol?: string
    path?: string
  }
}

function getServerHostAndProtocol(options: {
  server?: { host?: unknown; protocol?: unknown }
}): { host: string; protocol: string } | null {
  const host = options.server?.host
  const protocol = options.server?.protocol
  if (typeof host !== 'string' || host.length === 0) return null
  if (typeof protocol !== 'string' || protocol.length === 0) return null
  return { host, protocol }
}

/**
 * adds the desired provider module to the request object,
 * based on the providerName parameter specified
 */
export function getProviderMiddleware(
  providers: ProviderRegistry,
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
	  const server = getServerHostAndProtocol(req.companion.options)
	  if (ProviderClass && server) {
		  const { allowLocalUrls, providerOptions } = req.companion.options
		  const { oauthProvider } = ProviderClass
		  const providerOption = providerOptions?.[providerName]
		  const secretCandidate =
		    isRecord(providerOption) && typeof providerOption['secret'] === 'string'
		      ? providerOption['secret']
		      : undefined
		  if (isOAuthProvider(oauthProvider) && typeof secretCandidate !== 'string') {
		    logger.warn(
		      `missing OAuth client secret for provider ${providerName}`,
		      'provider.middleware.missing.secret',
		      req.id,
		    )
		  }
		  const secret = secretCandidate ?? ''

		    let providerGrantConfig: Record<string, unknown> | undefined
		    if (isOAuthProvider(oauthProvider)) {
		      req.companion.getProviderCredentials = getCredentialsResolver(
		        providerName,
		        req.companion.options,
		        req,
		      )
		      const resolvedGrantConfig = grantConfig[oauthProvider] ?? {}
		      providerGrantConfig = resolvedGrantConfig
		      req.companion.providerGrantConfig = resolvedGrantConfig
		    }

		    const providerArgs = {
		      secret,
		      providerName,
		      allowLocalUrls: !!allowLocalUrls,
		      ...(providerGrantConfig ? { providerGrantConfig } : {}),
		    }
		    req.companion.provider = new ProviderClass(providerArgs)
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
    { module: ProviderCtor; config: Record<string, unknown> }
  >,
  providers: ProviderRegistry,
  grantConfig: GrantConfig,
): void {
  Object.keys(customProviders).forEach((providerName) => {
    const customProvider = customProviders[providerName]
    if (!customProvider) return

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
      } & Record<string, unknown>
    >
  },
  grantConfig: GrantConfig,
  getOauthProvider?: (providerName: string) => string | undefined,
): void {
  const server = companionOptions.server ?? {}
  const providerOptions = companionOptions.providerOptions ?? {}
  const host = server.host
  const protocol = server.protocol
  if (typeof host !== 'string' || host.length === 0 || typeof protocol !== 'string' || protocol.length === 0) {
    logger.warn(
      'invalid provider options detected. Providers will not be loaded',
      'provider.options.invalid',
    )
    return
  }

  const defaults: NonNullable<GrantConfig['defaults']> = { host, protocol }
  if (typeof server.path === 'string') defaults.path = server.path
  grantConfig.defaults = defaults

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

      const provider = getDefaultProviders()[providerName]
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
        grantProviderConfig['redirect_uri'] = `${protocol}://${oauthDomain}${fullRedirectPath}`
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
