const jwt = require('jsonwebtoken')
const { encrypt, decrypt } = require('./utils')

// The Uppy auth token is a (JWT) container around provider OAuth access & refresh tokens.
// Providers themselves will verify these inner tokens.
// The expiry of the Uppy auth token should be higher than the expiry of the refresh token.
// Because some refresh tokens never expire, we set the Uppy auth token expiry very high.
// Chrome has a maximum cookie expiry of 400 days, so we'll use that (we also store the auth token in a cookie)
//
// If the Uppy auth token expiry were set too low (e.g. 24hr), we could risk this situation:
// A user starts an upload, thus creating an auth token. They leave the upload running over night.
// The upload finishes after a few hours, but with some failed files. Then the next day (say after 25hr)
// they would retry the failed tiles, however now the Uppy auth token has expired and
// even though the provider refresh token would still have been accepted and
// there's no way for them to retry their failed files.
// With 400 days, there's still a theoretical possibility but very low.
const EXPIRY = 60 * 60 * 24 * 400
const EXPIRY_MS = EXPIRY * 1000

/**
 *
 * @param {*} data
 * @param {string} secret
 */
const generateToken = (data, secret) => {
  return jwt.sign({ data }, secret, { expiresIn: EXPIRY })
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
module.exports.generateEncryptedToken = (payload, secret) => {
  // return payload // for easier debugging
  return encrypt(generateToken(payload, secret), secret)
}

/**
 *
 * @param {*} payload
 * @param {string} secret
 */
module.exports.generateEncryptedAuthToken = (payload, secret) => {
  return module.exports.generateEncryptedToken(JSON.stringify(payload), secret)
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
module.exports.verifyEncryptedToken = (token, secret) => {
  const ret = verifyToken(decrypt(token, secret), secret)
  if (!ret) throw new Error('No payload')
  return ret
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
module.exports.verifyEncryptedAuthToken = (token, secret, providerName) => {
  const json = module.exports.verifyEncryptedToken(token, secret)
  const tokens = JSON.parse(json)
  if (!tokens[providerName]) throw new Error(`Missing token payload for provider ${providerName}`)
  return tokens
}

const addToCookies = (res, token, companionOptions, authProvider, prefix) => {
  const cookieOptions = {
    maxAge: EXPIRY_MS,
    httpOnly: true,
  }

  // Fix to show thumbnails on Chrome
  // https://community.transloadit.com/t/dropbox-and-box-thumbnails-returning-401-unauthorized/15781/2
  if (companionOptions.server && companionOptions.server.protocol === 'https') {
    cookieOptions.sameSite = 'none'
    cookieOptions.secure = true
  }

  if (companionOptions.cookieDomain) {
    cookieOptions.domain = companionOptions.cookieDomain
  }
  // send signed token to client.
  res.cookie(`${prefix}--${authProvider}`, token, cookieOptions)
}

module.exports.addToCookiesIfNeeded = (req, res, uppyAuthToken) => {
  // some providers need the token in cookies for thumbnail/image requests
  if (req.companion.provider.needsCookieAuth) {
    addToCookies(res, uppyAuthToken, req.companion.options, req.companion.provider.authProvider, 'uppyAuthToken')
  }
}

/**
 *
 * @param {object} res
 * @param {object} companionOptions
 * @param {string} authProvider
 */
module.exports.removeFromCookies = (res, companionOptions, authProvider) => {
  const cookieOptions = {
    maxAge: EXPIRY_MS,
    httpOnly: true,
  }

  if (companionOptions.cookieDomain) {
    cookieOptions.domain = companionOptions.cookieDomain
  }

  res.clearCookie(`uppyAuthToken--${authProvider}`, cookieOptions)
}
