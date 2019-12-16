const jwt = require('jsonwebtoken')
const { encrypt, decrypt } = require('./utils')

/**
 *
 * @param {*} payload
 * @param {string} secret
 */
module.exports.generateToken = (payload, secret) => {
  return encrypt(jwt.sign({ data: payload }, secret, { expiresIn: 60 * 60 * 24 }), secret)
}

/**
 *
 * @param {string} token
 * @param {string} secret
 */
module.exports.verifyToken = (token, secret) => {
  try {
    // @ts-ignore
    return { payload: jwt.verify(decrypt(token, secret), secret, {}).data }
  } catch (err) {
    return { err }
  }
}

/**
 *
 * @param {object} res
 * @param {string} token
 * @param {object=} companionOptions
 * @param {string} providerName
 */
module.exports.addToCookies = (res, token, companionOptions, providerName) => {
  const cookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 30, // would expire after 30 days
    httpOnly: true
  }

  if (companionOptions.cookieDomain) {
    cookieOptions.domain = companionOptions.cookieDomain
  }
  // send signed token to client.
  res.cookie(`uppyAuthToken--${providerName}`, token, cookieOptions)
}

/**
 *
 * @param {object} res
 * @param {object=} companionOptions
 * @param {string} providerName
 */
module.exports.removeFromCookies = (res, companionOptions, providerName) => {
  const cookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 30, // would expire after 30 days
    httpOnly: true
  }

  if (companionOptions.cookieDomain) {
    cookieOptions.domain = companionOptions.cookieDomain
  }

  res.clearCookie(`uppyAuthToken--${providerName}`, cookieOptions)
}
