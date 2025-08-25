import jwt from 'jsonwebtoken'
import { decrypt, encrypt } from './utils.js'

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
/**
 *
 * @param {*} data
 * @param {string} secret
 * @param {number} maxAge
 */
const generateToken = (data, secret, maxAge) => {
  return jwt.sign({ data }, secret, { expiresIn: maxAge })
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
const verifyToken = (token, secret) => {
  // @ts-ignore
  return jwt.verify(token, secret, {}).data
}

/**
 *
 * @param {*} payload
 * @param {string} secret
 */
export const generateEncryptedToken = (
  payload,
  secret,
  maxAge = MAX_AGE_24H,
) => {
  // return payload // for easier debugging
  return encrypt(generateToken(payload, secret, maxAge), secret)
}

/**
 * @param {*} payload
 * @param {string} secret
 */
export const generateEncryptedAuthToken = (payload, secret, maxAge) => {
  return generateEncryptedToken(JSON.stringify(payload), secret, maxAge)
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
export const verifyEncryptedToken = (token, secret) => {
  const ret = verifyToken(decrypt(token, secret), secret)
  if (!ret) throw new Error('No payload')
  return ret
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
export const verifyEncryptedAuthToken = (token, secret, providerName) => {
  const json = verifyEncryptedToken(token, secret)
  const tokens = JSON.parse(json)
  if (!tokens[providerName])
    throw new Error(`Missing token payload for provider ${providerName}`)
  return tokens
}

function getCommonCookieOptions({ companionOptions }) {
  const cookieOptions = {
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

const getCookieName = (oauthProvider) => `uppyAuthToken--${oauthProvider}`

const addToCookies = ({
  res,
  token,
  companionOptions,
  oauthProvider,
  maxAge = MAX_AGE_24H,
}) => {
  const cookieOptions = {
    ...getCommonCookieOptions({ companionOptions }),
    maxAge: maxAge * 1000,
  }

  // send signed token to client.
  res.cookie(getCookieName(oauthProvider), token, cookieOptions)
}

export const addToCookiesIfNeeded = (req, res, uppyAuthToken, maxAge) => {
  // some providers need the token in cookies for thumbnail/image requests
  if (req.companion.provider.needsCookieAuth) {
    addToCookies({
      res,
      token: uppyAuthToken,
      companionOptions: req.companion.options,
      oauthProvider: req.companion.providerClass.oauthProvider,
      maxAge,
    })
  }
}

/**
 *
 * @param {object} res
 * @param {object} companionOptions
 * @param {string} oauthProvider
 */
export const removeFromCookies = (res, companionOptions, oauthProvider) => {
  // options must be identical to those given to res.cookie(), excluding expires and maxAge.
  // https://expressjs.com/en/api.html#res.clearCookie
  const cookieOptions = getCommonCookieOptions({ companionOptions })

  res.clearCookie(getCookieName(oauthProvider), cookieOptions)
}
