const jwt = require('jsonwebtoken')
const { encrypt, decrypt } = require('./utils')

const EXPIRY = 60 * 60 * 24 // one day (24 hrs)

/**
 *
 * @param {*} payload
 * @param {string} secret
 */
module.exports.generateToken = (payload, secret) => {
  return jwt.sign({ data: payload }, secret, { expiresIn: EXPIRY })
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
module.exports.verifyToken = (token, secret) => {
  try {
    // @ts-ignore
    return { payload: jwt.verify(token, secret, {}).data }
  } catch (err) {
    return { err }
  }
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
 * @param {string} token
 * @param {string} secret
 */
module.exports.verifyEncryptedToken = (token, secret) => {
  try {
    return module.exports.verifyToken(decrypt(token, secret), secret)
  } catch (err) {
    return { err }
  }
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
