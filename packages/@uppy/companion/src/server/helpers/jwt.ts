import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'
import { decrypt, encrypt } from './utils.js'
import type { CompanionRuntimeOptions } from '../../types/companion-options.js'
import { isRecord } from './type-guards.js'

// The Uppy auth token is an encrypted JWT & JSON encoded container.
// It used to simply contain an OAuth access_token and refresh_token for a specific provider.
// However now we allow more data to be stored in it. This allows for storing other state or parameters needed for that
// specific provider, like username, password, host names etc.
// The different providers APIs themselves will verify these inner tokens through Provider classes.
// The expiry of the Uppy auth token should be higher than the expiry of the refresh token.
// Because some refresh tokens normally never expire, we set the Uppy auth token expiry very high.
// Chrome has a maximum cookie expiry of 400 days, so we'll use that (we also store the auth token in a cookie)
//
// If the Uppy auth token expiry were set too low (e.g. 24hr), we could risk this situation:
// A user starts an upload, thus creating an auth token. They leave the upload running over night.
// The upload finishes after a few hours, but with some failed files. Then the next day (say after 25hr)
// they would retry the failed tiles, however now the Uppy auth token has expired and
// even though the provider refresh token would still have been accepted and
// there's no way for them to retry their failed files.
// With 400 days, there's still a theoretical possibility but very low.
export const MAX_AGE_REFRESH_TOKEN = 60 * 60 * 24 * 400
export const MAX_AGE_24H = 60 * 60 * 24

type EncryptionSecret = string | Buffer

const generateToken = (
  data: unknown,
  secret: EncryptionSecret,
  maxAge: number,
): string => {
  return jwt.sign({ data }, secret, { expiresIn: maxAge })
}

const verifyToken = (token: string, secret: EncryptionSecret): unknown => {
  const decoded = jwt.verify(token, secret, {})
  if (!decoded || typeof decoded !== 'object' || !('data' in decoded)) {
    throw new Error('Invalid token payload')
  }
  return Reflect.get(decoded, 'data')
}

export const generateEncryptedToken = (
  payload: unknown,
  secret: EncryptionSecret,
  maxAge = MAX_AGE_24H,
): string => {
  // return payload // for easier debugging
  return encrypt(generateToken(payload, secret, maxAge), secret)
}

export const generateEncryptedAuthToken = (
  payload: unknown,
  secret: EncryptionSecret,
  maxAge?: number,
): string => {
  return generateEncryptedToken(JSON.stringify(payload), secret, maxAge)
}

export const verifyEncryptedToken = (
  token: string,
  secret: EncryptionSecret,
): string => {
  const ret = verifyToken(decrypt(token, secret), secret)
  if (!ret) throw new Error('No payload')
  if (typeof ret !== 'string') throw new Error('Invalid token payload type')
  return ret
}

export const verifyEncryptedAuthToken = (
  token: string,
  secret: EncryptionSecret,
  providerName: string,
): Record<string, unknown> => {
  const json = verifyEncryptedToken(token, secret)
  const tokens: unknown = JSON.parse(json)
  if (!isRecord(tokens) || !Object.hasOwn(tokens, providerName))
    throw new Error(`Missing token payload for provider ${providerName}`)
  return tokens
}

function getCommonCookieOptions({
  companionOptions,
}: {
  companionOptions: CompanionRuntimeOptions
}): Record<string, unknown> {
  const cookieOptions: Record<string, unknown> = {
    httpOnly: true,
  }

  // Fix to show thumbnails on Chrome
  // https://community.transloadit.com/t/dropbox-and-box-thumbnails-returning-401-unauthorized/15781/2
  // Note that sameSite cookies also require secure (which needs https), so thumbnails don't work from localhost
  // to test locally, you can manually find the URL of the image and open it in a separate browser tab
  if (companionOptions.server && companionOptions.server.protocol === 'https') {
    cookieOptions.sameSite = 'none'
    cookieOptions.secure = true
  }

  if (companionOptions.cookieDomain) {
    cookieOptions.domain = companionOptions.cookieDomain
  }

  return cookieOptions
}

const getCookieName = (oauthProvider: string): string =>
  `uppyAuthToken--${oauthProvider}`

const addToCookies = ({
  res,
  token,
  companionOptions,
  oauthProvider,
  maxAge = MAX_AGE_24H,
}: {
  res: Response
  token: string
  companionOptions: CompanionRuntimeOptions
  oauthProvider: string
  maxAge?: number
}): void => {
  const cookieOptions = {
    ...getCommonCookieOptions({ companionOptions }),
    maxAge: maxAge * 1000,
  }

  // send signed token to client.
  res.cookie(getCookieName(oauthProvider), token, cookieOptions)
}

export const addToCookiesIfNeeded = (
  req: Request,
  res: Response,
  uppyAuthToken: string,
  maxAge?: number,
): void => {
  // some providers need the token in cookies for thumbnail/image requests
  if (req.companion.provider?.needsCookieAuth) {
    const oauthProvider = req.companion.providerClass?.oauthProvider
    if (typeof oauthProvider !== 'string' || oauthProvider.length === 0) return
    addToCookies({
      res,
      token: uppyAuthToken,
      companionOptions: req.companion.options,
      oauthProvider,
      maxAge,
    })
  }
}

export const removeFromCookies = (
  res: Response,
  companionOptions: CompanionRuntimeOptions,
  oauthProvider: string,
): void => {
  // options must be identical to those given to res.cookie(), excluding expires and maxAge.
  // https://expressjs.com/en/api.html#res.clearCookie
  const cookieOptions = getCommonCookieOptions({ companionOptions })

  res.clearCookie(getCookieName(oauthProvider), cookieOptions)
}
