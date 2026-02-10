import { htmlEscape } from 'escape-goat'
import type { NextFunction, Request, Response } from 'express'
import got from 'got'
import type { CompanionRuntimeOptions } from '../../types/companion-options.ts'
import * as tokenService from '../helpers/jwt.ts'
import * as oAuthState from '../helpers/oauth-state.ts'
import { isRecord, toError } from '../helpers/type-guards.ts'
import { getRedirectPath, getURLBuilder } from '../helpers/utils.ts'
import logger from '../logger.ts'
import type Provider from './Provider.ts'

/**
 * @param url
 * @param providerName
 * @param credentialRequestParams - null asks for default credentials.
 */
async function fetchKeys(
  url: string,
  providerName: string,
  credentialRequestParams: unknown | null,
): Promise<Record<string, unknown>> {
  try {
    const resp = await got
      .post(url, {
        json: { provider: providerName, parameters: credentialRequestParams },
      })
      .json<{ credentials?: unknown }>()

    const credentials = isRecord(resp) ? resp.credentials : undefined
    if (!isRecord(credentials))
      throw new Error('Received no remote credentials')

    return credentials
  } catch (err) {
    logger.error(err, 'credentials.fetch.fail')
    throw err
  }
}

/**
 * Fetches for a providers OAuth credentials. If the config for that provider allows fetching
 * of the credentials via http, and the `credentialRequestParams` argument is provided, the oauth
 * credentials will be fetched via http. Otherwise, the credentials provided via companion options
 * will be used instead.
 *
 * @param providerName the name of the provider whose oauth keys we want to fetch (e.g onedrive)
 * @param companionOptions the companion options object
 * @param credentialRequestParams the params that should be sent if an http request is required.
 */
async function fetchProviderKeys(
  providerName: string,
  companionOptions: CompanionRuntimeOptions,
  credentialRequestParams: unknown,
): Promise<Record<string, unknown> | null> {
  const providerOptions = companionOptions['providerOptions']
  const customProviders = companionOptions['customProviders']

  let providerConfig: Record<string, unknown> | undefined
  if (isRecord(providerOptions) && isRecord(providerOptions[providerName])) {
    providerConfig = providerOptions[providerName]
  }
  if (
    !providerConfig &&
    isRecord(customProviders) &&
    isRecord(customProviders[providerName])
  ) {
    const candidate = customProviders[providerName]
    const config = isRecord(candidate) ? candidate['config'] : undefined
    if (isRecord(config)) providerConfig = config
  }

  if (!providerConfig) {
    return null
  }

  const credentialsURL = providerConfig['credentialsURL']
  if (typeof credentialsURL !== 'string' || credentialsURL.length === 0) {
    return providerConfig
  }

  // If a default key is configured, do not ask the credentials endpoint for it.
  // In a future version we could make this an XOR thing, providing either an endpoint or global keys,
  // but not both.
  const key = providerConfig['key']
  if (!credentialRequestParams && typeof key === 'string' && key.length > 0) {
    return providerConfig
  }

  return fetchKeys(
    credentialsURL,
    providerName,
    credentialRequestParams || null,
  )
}

/**
 * Returns a request middleware function that can be used to pre-fetch a provider's
 * Oauth credentials before the request is passed to the Oauth handler (https://github.com/simov/grant in this case).
 *
 * @param providers provider classes enabled for this server
 * @param companionOptions companion options object
 */
export const getCredentialsOverrideMiddleware = (
  providers: Record<string, typeof Provider>,
  companionOptions: CompanionRuntimeOptions,
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
	  try {
	    const { oauthProvider, override } = req.params
	    if (typeof oauthProvider !== 'string' || oauthProvider.length === 0) {
	      next()
	      return
	    }
	    const [providerName] = Object.keys(providers).filter(
	      (name) => providers[name]?.oauthProvider === oauthProvider,
	    )
	    if (!providerName) {
	      next()
	      return
	    }

	    const providerOptions = companionOptions['providerOptions']
	    const providerOption = isRecord(providerOptions)
	      ? providerOptions[providerName]
	      : undefined
	    const credentialsURL =
	      isRecord(providerOption) ? providerOption['credentialsURL'] : undefined
	    if (typeof credentialsURL !== 'string' || credentialsURL.length === 0) {
	      next()
	      return
	    }

      const grantDynamic = oAuthState.getGrantDynamicFromRequest(req)
      // only use state via session object if user isn't making intial "connect" request.
      // override param indicates subsequent requests from the oauth flow
      const state = override
        ? isRecord(grantDynamic) && typeof grantDynamic['state'] === 'string'
          ? grantDynamic['state']
          : undefined
        : typeof req.query['state'] === 'string'
          ? req.query['state']
          : undefined
      if (state == null || state.length === 0) {
        next()
        return
      }

      const { secret, preAuthSecret } = companionOptions
      if (typeof secret !== 'string' || secret.length === 0) {
        next()
        return
      }
      if (typeof preAuthSecret !== 'string' || preAuthSecret.length === 0) {
        next()
        return
      }

      const preAuthToken = oAuthState.getFromState(
        state,
        'preAuthToken',
        secret,
      )
      if (typeof preAuthToken !== 'string' || preAuthToken.length === 0) {
        next()
        return
      }

      let payload: unknown
      try {
        payload = tokenService.verifyEncryptedToken(preAuthToken, preAuthSecret)
      } catch (_err) {
        next()
        return
      }

      const credentials = await fetchProviderKeys(
        providerName,
        companionOptions,
        payload,
      )
      if (!credentials) {
        next()
        return
      }

      // Besides the key and secret the fetched credentials can also contain `origins`,
      // which is an array of strings of allowed origins to prevent any origin from getting the OAuth
      // token through window.postMessage (see comment in connect.js).
      // postMessage happens in send-token.js, which is a different request, so we need to put the allowed origins
      // on the encrypted session state to access it later there.
      const origins = credentials['origins']
      if (Array.isArray(origins) && origins.every((o) => typeof o === 'string') && origins.length > 0) {
        const decodedState = oAuthState.decodeState(state, secret)
        decodedState['customerDefinedAllowedOrigins'] = origins
        const newState = oAuthState.encodeState(decodedState, secret)
        if (isRecord(req.session)) {
          const prevGrant = isRecord(req.session['grant']) ? req.session['grant'] : {}
          const prevDynamic = isRecord(prevGrant['dynamic'])
            ? prevGrant['dynamic']
            : {}
          req.session['grant'] = {
            ...prevGrant,
            dynamic: {
              ...prevDynamic,
              state: newState,
            },
          }
        }
      }

      const dynamic: Record<string, unknown> = {}
      const fetchedKey = credentials['key']
      const fetchedSecret = credentials['secret']
      if (typeof fetchedKey === 'string' && fetchedKey.length > 0)
        dynamic['key'] = fetchedKey
      if (typeof fetchedSecret === 'string' && fetchedSecret.length > 0)
        dynamic['secret'] = fetchedSecret
      if (origins) dynamic['origins'] = origins

      res.locals['grant'] = { dynamic }

      const gateway = credentials['transloadit_gateway']
      if (typeof gateway === 'string' && gateway.length > 0) {
        const redirectPath = getRedirectPath(providerName)
        const fullRedirectPath = getURLBuilder(companionOptions)(
          redirectPath,
          true,
          true,
        )
        const redirectUri = new URL(fullRedirectPath, gateway).toString()
        logger.info('Using redirect URI from transloadit_gateway', redirectUri)
        const grant = res.locals['grant']
        if (isRecord(grant) && isRecord(grant['dynamic'])) {
          grant['dynamic']['redirect_uri'] = redirectUri
        }
      }

      next()
    } catch (keyErr) {
      const error = toError(keyErr)
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
          <p>Internal error message: ${htmlEscape(error.message)}</p>
        </body>
        </html>
      `)
    }
  }
}

/**
 * Returns a request scoped function that can be used to get a provider's oauth credentials
 * through out the lifetime of the request.
 *
 * @param providerName the name of the provider attached to the scope of the request
 * @param companionOptions the companion options object
 * @param req the express request object for the said request
 */
export const getCredentialsResolver = (
  providerName: string,
  companionOptions: CompanionRuntimeOptions,
  req: Request,
): (() => Promise<Record<string, unknown> | null>) => {
	  const credentialsResolver = () => {
	    const encodedCredentialsParams = req.header('uppy-credentials-params')
	    let credentialRequestParams = null
	    if (encodedCredentialsParams) {
	      try {
	        const parsed: unknown = JSON.parse(atob(encodedCredentialsParams))
	        credentialRequestParams =
	          isRecord(parsed) && Object.hasOwn(parsed, 'params')
	            ? parsed['params']
	            : null
	      } catch (error) {
	        logger.error(error, 'credentials.resolve.fail', req.id)
	      }
	    }

    return fetchProviderKeys(
      providerName,
      companionOptions,
      credentialRequestParams,
    )
  }

  return credentialsResolver
}
