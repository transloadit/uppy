const jwt = require('jsonwebtoken')
const { encrypt, decrypt } = require('./utils')

const EXPIRY = 60 * 60 * 24 // one day (24 hrs)

/**
 *
 * @param {*} data
 * @param {string} secret
 */
module.exports.generateToken = (data, secret) => {
  return jwt.sign({ data }, secret, { expiresIn: EXPIRY })
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
module.exports.verifyToken = (token, secret) => {
  // @ts-ignore
  return jwt.verify(token, secret, {}).data
}

/**
 *
 * @param {*} payload
 * @param {string} secret
 */
module.exports.generateEncryptedToken = (payload, secret) => {
  return encrypt(module.exports.generateToken(payload, secret), secret)
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
  const ret = module.exports.verifyToken(decrypt(token, secret), secret)
  if (!ret) throw new Error('No payload')
  return ret
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
module.exports.verifyEncryptedAuthToken = (token, secret) => {
  const json = module.exports.verifyEncryptedToken(token, secret)
  return JSON.parse(json)
}

const addToCookies = (res, token, companionOptions, authProvider, prefix) => {
  const cookieOptions = {
    maxAge: 1000 * EXPIRY, // would expire after one day (24 hrs)
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

/**
 *
 * @param {object} res
 * @param {string} token
 * @param {object} companionOptions
 * @param {string} authProvider
 */
module.exports.addToCookies = (res, token, companionOptions, authProvider) => {
  addToCookies(res, token, companionOptions, authProvider, 'uppyAuthToken')
}

/**
 *
 * @param {object} res
 * @param {object} companionOptions
 * @param {string} authProvider
 */
module.exports.removeFromCookies = (res, companionOptions, authProvider) => {
  const cookieOptions = {
    maxAge: 1000 * EXPIRY, // would expire after one day (24 hrs)
    httpOnly: true,
  }

  if (companionOptions.cookieDomain) {
    cookieOptions.domain = companionOptions.cookieDomain
  }

  res.clearCookie(`uppyAuthToken--${authProvider}`, cookieOptions)
}
