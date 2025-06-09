const crypto = require('node:crypto')
const logger = require('../logger.js')


const authTagLength = 16
const nonceLength = 16
const encryptionKeyLength = 32
const ivLength = 12

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
        return undefined
      }
      cache.push(value)
    }
    return value
  })
}

// all paths are assumed to be '/' prepended
/**
 * Returns a url builder
 *
 * @param {object} options companion options
 */
module.exports.getURLBuilder = (options) => {
  /**
   * Builds companion targeted url
   *
   * @param {string} subPath the tail path of the url
   * @param {boolean} isExternal if the url is for the external world
   * @param {boolean} [excludeHost] if the server domain and protocol should be included
   */
  const buildURL = (subPath, isExternal, excludeHost) => {
    let path = ''

    if (isExternal && options.server.implicitPath) {
      path += options.server.implicitPath
    }

    if (options.server.path) {
      path += options.server.path
    }

    path += subPath

    if (excludeHost) {
      return path
    }

    return `${options.server.protocol}://${options.server.host}${path}`
  }

  return buildURL
}

module.exports.getRedirectPath = (providerName) => `/${providerName}/redirect`;

/**
 * Create an AES-CCM encryption key and initialization vector from the provided secret
 * and a random nonce.
 *
 * @param {string|Buffer} secret
 * @param {Buffer|undefined} nonce
 */
function createSecrets(secret, nonce) {
  const key = crypto.hkdfSync('sha256', secret, new Uint8Array(32), nonce, encryptionKeyLength + ivLength)
  const buf = Buffer.from(key)
  return {
    key: buf.subarray(0, encryptionKeyLength),
    iv: buf.subarray(encryptionKeyLength, encryptionKeyLength + ivLength),
  }
}

/**
 * Encrypt a buffer or string with AES256 and a random iv.
 *
 * @param {string} input
 * @param {string|Buffer} secret
 * @returns {string} Ciphertext as a hex string, prefixed with 32 hex characters containing the iv.
 */
module.exports.encrypt = (input, secret) => {
  const nonce = crypto.randomBytes(nonceLength)
  const { key, iv } = createSecrets(secret, nonce)
  const cipher = crypto.createCipheriv('aes-256-ccm', key, iv, { authTagLength })
  const encrypted = Buffer.concat([
    cipher.update(input, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ])
  // add nonce to encrypted string to use for decryption
  return `${nonce.toString('hex')}${encrypted.toString('base64url')}`
}

// todo backwards compat for old tokens - remove in the future
function compatDecrypt(encrypted, secret) {
  // Need at least 32 chars for the iv
  if (encrypted.length < 32) {
    throw new Error('Invalid encrypted value. Maybe it was generated with an old Companion version?')
  }

  // NOTE: The first 32 characters are the iv, in hex format. The rest is the encrypted string, in base64 format.
  const iv = Buffer.from(encrypted.slice(0, 32), 'hex')
  const encryptionWithoutIv = encrypted.slice(32)

  let decipher
  try {
    const secretHashed = crypto.createHash('sha256')
    secretHashed.update(secret)
    decipher = crypto.createDecipheriv('aes256', secretHashed.digest(), iv)
  } catch (err) {
    if (err.code === 'ERR_CRYPTO_INVALID_IV') {
      throw new Error('Invalid initialization vector')
    } else {
      throw err
    }
  }

  const urlDecode = (encoded) => encoded.replace(/-/g, '+').replace(/_/g, '/').replace(/~/g, '=')
  let decrypted = decipher.update(urlDecode(encryptionWithoutIv), 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Decrypt an iv-prefixed or string with AES256. The iv should be in the first 32 hex characters.
 *
 * @param {string} encrypted hex encoded string of encrypted data
 * @param {string|Buffer} secret
 * @returns {string} Decrypted value.
 */
module.exports.decrypt = (encrypted, secret) => {
  try {
    const nonceHexLength = nonceLength * 2 // because hex encoding uses 2 bytes per byte

    // NOTE: The first 32 characters are the nonce, in hex format.
    const nonce = Buffer.from(encrypted.slice(0, nonceHexLength), 'hex')
    // The rest is the encrypted string, in base64url format.
    const encryptionWithoutNonce = Buffer.from(encrypted.slice(nonceHexLength), 'base64url')
    // The last 16 bytes of the rest is the authentication tag
    const authTag = encryptionWithoutNonce.subarray(-authTagLength)
    // and the rest (from beginning) is the encrypted data
    const encryptionWithoutNonceAndTag = encryptionWithoutNonce.subarray(0, -authTagLength)
    
    if (nonce.length < nonceLength) {
      throw new Error('Invalid encrypted value. Maybe it was generated with an old Companion version?')
    }
    
    const { key, iv } = createSecrets(secret, nonce)

    const decipher = crypto.createDecipheriv('aes-256-ccm', key, iv, { authTagLength })
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(encryptionWithoutNonceAndTag),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch (err) {
    // todo backwards compat for old tokens - remove in the future
    logger.info('Failed to decrypt - trying old encryption format instead', err)
    return compatDecrypt(encrypted, secret)
  }
}

module.exports.defaultGetKey = ({ filename }) => {
  return `${crypto.randomUUID()}-${filename}`
}

/**
 * Our own HttpError in cases where we can't use `got`'s `HTTPError`
 */
class HttpError extends Error {
  statusCode

  responseJson

  constructor({ statusCode, responseJson }) {
    super(`Request failed with status ${statusCode}`)
    this.statusCode = statusCode
    this.responseJson = responseJson
    this.name = 'HttpError'
  }
}

module.exports.HttpError = HttpError

module.exports.prepareStream = async (stream) => new Promise((resolve, reject) => {
  stream
    .on('response', (response) => {
      const contentLengthStr = response.headers['content-length']
      const contentLength = parseInt(contentLengthStr, 10);
      const size = !Number.isNaN(contentLength) && contentLength >= 0 ? contentLength : undefined;
      // Don't allow any more data to flow yet.
      // https://github.com/request/request/issues/1990#issuecomment-184712275
      stream.pause()
      resolve({ size })
    })
    .on('error', (err) => {
      // In this case the error object is not a normal GOT HTTPError where json is already parsed,
      // we use our own HttpError error for this scenario.
      if (typeof err.response?.body === 'string' && typeof err.response?.statusCode === 'number') {
        let responseJson
        try {
          responseJson = JSON.parse(err.response.body)
        } catch (err2) {
          reject(err)
          return
        }

        reject(new HttpError({ statusCode: err.response.statusCode, responseJson }))
        return
      }

      reject(err)
    })
})

module.exports.getBasicAuthHeader = (key, secret) => {
  const base64 = Buffer.from(`${key}:${secret}`, 'binary').toString('base64')
  return `Basic ${base64}`
}

const rfc2047Encode = (dataIn) => {
  const data = `${dataIn}`
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(data)) return data // we return ASCII as is
  return `=?UTF-8?B?${Buffer.from(data).toString('base64')}?=` // We encode non-ASCII strings
}

module.exports.rfc2047EncodeMetadata = (metadata) => (
  Object.fromEntries(Object.entries(metadata).map((entry) => entry.map(rfc2047Encode)))
)

/**
 *
 * @param {{
 * bucketOrFn: string | ((a: {
 * req: import('express').Request,
 * metadata: Record<string, string>,
 * filename: string | undefined,
 * }) => string),
 * req: import('express').Request,
 * metadata?: Record<string, string>,
 * filename?: string,
 * }} param0
 * @returns
 */
module.exports.getBucket = ({ bucketOrFn, req, metadata, filename }) => {
  const bucket = typeof bucketOrFn === 'function' ? bucketOrFn({ req, metadata, filename }) : bucketOrFn

  if (typeof bucket !== 'string' || bucket === '') {
    // This means a misconfiguration or bug
    throw new TypeError('s3: bucket key must be a string or a function resolving the bucket string')
  }
  return bucket
}

/**
 * Truncate filename to a maximum length.
 *
 * @param {string} filename
 * @param {number} maxFilenameLength
 * @returns {string}
 */
module.exports.truncateFilename = (filename, maxFilenameLength) => {
  return filename.slice(maxFilenameLength * -1)
}
