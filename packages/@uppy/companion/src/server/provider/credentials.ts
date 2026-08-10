import { htmlEscape } from 'escape-goat'
import type { NextFunction, Request, Response } from 'express'
import got from 'got'
import type { CredentialsFetchResponse } from '../../schemas/companion.js'
import type { CompanionRuntimeOptions } from '../../types/companion-options.js'
import type { CompanionExpressLocals } from '../../types/express.js'
import * as tokenService from '../helpers/jwt.js'
import * as oAuthState from '../helpers/oauth-state.js'
import { isRecord, toError } from '../helpers/type-guards.js'
import { getRedirectPath, getURLBuilder } from '../helpers/utils.js'
import logger from '../logger.js'
import type Provider from './Provider.js'

/**
 * @param url
 * @param providerName
 * @param credentialRequestParams - null asks for default credentials.
 */
async function fetchKeys(
  url: string,
  providerName: string,
  credentialRequestParams: unknown | null,
) {
  try {
    const { credentials } = await got
      .post(url, {
        json: { provider: providerName, parameters: credentialRequestParams },
      })
      .json<{ credentials?: CredentialsFetchResponse }>()

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
): Promise<CredentialsFetchResponse | null> {
  let providerConfig = companionOptions.providerOptions[providerName]
  if (!providerConfig) {
    providerConfig = companionOptions.customProviders?.[providerName]?.config
  }

  if (!providerConfig) {
    return null
  }

  // If a default key is configured, do not ask the credentials endpoint for it.
  // In a future version we could make this an XOR thing, providing either an endpoint or global keys,
  // but not both.
  const key = providerConfig.key
  if (!credentialRequestParams && key != null) {
    return providerConfig
  }

  const credentialsURL = providerConfig.credentialsURL
  if (credentialsURL == null) {
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
  return async (
    req: Request,
    res: Response<unknown, CompanionExpressLocals>,
    next: NextFunction,
  ) => {
    try {
      const { oauthProvider, override } = req.params
      if (oauthProvider == null || oauthProvider.length === 0) {
        next()
        return
      }
      const [providerName] = Object.keys(providers).filter(
        (name) => providers[name]?.oauthProvider === oauthProvider,
      )
      if (
        !providerName ||
        !companionOptions.providerOptions[providerName]?.credentialsURL
      ) {
        next()
        return
      }

      const grantDynamic = oAuthState.getGrantDynamicFromRequest(req)
      // only use state via session object if user isn't making intial "connect" request.
      // override param indicates subsequent requests from the oauth flow

      const state = override ? grantDynamic.state : req.query['state']
      if (!state || typeof state !== 'string') {
        next()
        return
      }

      const { secret, preAuthSecret } = companionOptions
      if (preAuthSecret == null) {
        next()
        return
      }

      const preAuthToken = oAuthState.getFromState(
        state,
        'preAuthToken',
        secret,
      )
      if (preAuthToken == null) {
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
      const { origins } = credentials
      if (Array.isArray(origins) && origins.length > 0) {
        const decodedState = oAuthState.decodeState(state, secret)
        decodedState['customerDefinedAllowedOrigins'] = origins
        const newState = oAuthState.encodeState(decodedState, secret)
        if (req.session != null) {
          req.session.grant = {
            ...req.session.grant,
            dynamic: {
              ...req.session.grant?.dynamic,
              state: newState,
            },
          }
        }
      }

      const dynamic: Record<string, unknown> = {}
      const fetchedKey = credentials.key
      const fetchedSecret = credentials.secret
      if (fetchedKey != null) dynamic['key'] = fetchedKey
      if (fetchedSecret != null) dynamic['secret'] = fetchedSecret
      if (origins != null) dynamic['origins'] = origins

      res.locals['grant'] = { dynamic }

      const gateway = credentials.transloadit_gateway
      if (typeof gateway === 'string') {
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
): (() => Promise<CredentialsFetchResponse | null>) => {
  const credentialsResolver = () => {
    const encodedCredentialsParams = req.header('uppy-credentials-params')
    let credentialRequestParams: unknown = null
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
