const request = require('request')
const crypto = require('crypto')

/**
 *
 * @param {string} value
 * @param {string[]} criteria
 * @returns {boolean}
 */
exports.hasMatch = (value, criteria) => {
  return criteria.some((i) => {
    return value === i || (new RegExp(i)).test(value)
  })
}

/**
 *
 * @param {object} data
 * @returns {string}
 */
exports.jsonStringify = (data) => {
  const cache = []
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return
      }
      cache.push(value)
    }
    return value
  })
}

/**
 * Does a simple html sanitization on the passed value
 *
 * @param {string} text
 */
exports.sanitizeHtml = (text) => {
  return text.replace(/<\/?[^>]+(>|$)/g, '')
}

/**
 * Gets the size and content type of a url's content
 *
 * @param {string} url
 * @return {Promise}
 */
exports.getURLMeta = (url) => {
  return new Promise((resolve, reject) => {
    const opts = {
      uri: url,
      method: 'HEAD',
      followAllRedirects: true
    }

    request(opts, (err, response, body) => {
      if (err) {
        reject(err)
      } else {
        resolve({
          type: response.headers['content-type'],
          size: parseInt(response.headers['content-length'])
        })
      }
    })
  })
}

// all paths are assumed to be '/' prepended
/**
 * Returns a url builder
 *
 * @param {object} options uppy options
 */
module.exports.getURLBuilder = (options) => {
  /**
   * Builds uppy targeted url
   *
   * @param {string} path the tail path of the url
   * @param {boolean} isExternal if the url is for the external world
   * @param {boolean=} excludeHost if the server domain and protocol should be included
   */
  const buildURL = (path, isExternal, excludeHost) => {
    let url = path
    // supports for no path specified too
    if (isExternal) {
      url = `${options.server.implicitPath || ''}${url}`
    }

    url = `${options.server.path || ''}${url}`

    if (!excludeHost) {
      url = `${options.server.protocol}://${options.server.host}${url}`
    }

    return url
  }

  return buildURL
}

/**
 * Ensure that a user-provided `secret` is 32 bytes long (the length required
 * for an AES256 key) by hashing it with SHA256.
 *
 * @param {string|Buffer} secret
 */
function createSecret (secret) {
  const hash = crypto.createHash('sha256')
  hash.update(secret)
  return hash.digest()
}

/**
 * Create an initialization vector for AES256.
 *
 * @return {Buffer}
 */
function createIv () {
  return crypto.randomBytes(16)
}

/**
 * Encrypt a buffer or string with AES256 and a random iv.
 *
 * @param {string} input
 * @param {string|Buffer} secret
 * @return {string} Ciphertext as a hex string, prefixed with 32 hex characters containing the iv.
 */
module.exports.encrypt = (input, secret) => {
  const iv = createIv()
  const cipher = crypto.createCipheriv('aes256', createSecret(secret), iv)
  let encrypted = iv.toString('hex')
  encrypted += cipher.update(input, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

/**
 * Decrypt an iv-prefixed or string with AES256. The iv should be in the first 32 hex characters.
 *
 * @param {string} encrypted
 * @param {string|Buffer} secret
 * @return {string} Decrypted value.
 */
module.exports.decrypt = (encrypted, secret) => {
  // Need at least 32 chars for the iv
  if (encrypted.length < 32) {
    throw new Error('Invalid encrypted value. Maybe it was generated with an old Companion version?')
  }

  const iv = Buffer.from(encrypted.slice(0, 32), 'hex')
  const decipher = crypto.createDecipheriv('aes256', createSecret(secret), iv)
  let decrypted = decipher.update(encrypted.slice(32), 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
