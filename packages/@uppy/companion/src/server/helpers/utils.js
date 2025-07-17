import crypto from 'node:crypto'

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
export const hasMatch = (value, criteria) => {
  return criteria.some((i) => {
    return value === i || new RegExp(i).test(value)
  })
}

/**
 *
 * @param {object} data
 * @returns {string}
 */
export const jsonStringify = (data) => {
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
export function getURLBuilder(options) {
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

export const getRedirectPath = (providerName) => `/${providerName}/redirect`

/**
 * Create an AES-CCM encryption key and initialization vector from the provided secret
 * and a random nonce.
 *
 * @param {string|Buffer} secret
 * @param {Buffer|undefined} nonce
 */
function createSecrets(secret, nonce) {
  const key = crypto.hkdfSync(
    'sha256',
    secret,
    new Uint8Array(32),
    nonce,
    encryptionKeyLength + ivLength,
  )
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
export const encrypt = (input, secret) => {
  const nonce = crypto.randomBytes(nonceLength)
  const { key, iv } = createSecrets(secret, nonce)
  const cipher = crypto.createCipheriv('aes-256-ccm', key, iv, {
    authTagLength,
  })
  const encrypted = Buffer.concat([
    cipher.update(input, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ])
  // add nonce to encrypted string to use for decryption
  return `${nonce.toString('hex')}${encrypted.toString('base64url')}`
}

/**
 * Decrypt an iv-prefixed or string with AES256. The iv should be in the first 32 hex characters.
 *
 * @param {string} encrypted hex encoded string of encrypted data
 * @param {string|Buffer} secret
 * @returns {string} Decrypted value.
 */
export const decrypt = (encrypted, secret) => {
  const nonceHexLength = nonceLength * 2 // because hex encoding uses 2 bytes per byte

  // NOTE: The first 32 characters are the nonce, in hex format.
  const nonce = Buffer.from(encrypted.slice(0, nonceHexLength), 'hex')
  // The rest is the encrypted string, in base64url format.
  const encryptionWithoutNonce = Buffer.from(
    encrypted.slice(nonceHexLength),
    'base64url',
  )
  // The last 16 bytes of the rest is the authentication tag
  const authTag = encryptionWithoutNonce.subarray(-authTagLength)
  // and the rest (from beginning) is the encrypted data
  const encryptionWithoutNonceAndTag = encryptionWithoutNonce.subarray(
    0,
    -authTagLength,
  )

  if (nonce.length < nonceLength) {
    throw new Error(
      'Invalid encrypted value. Maybe it was generated with an old Companion version?',
    )
  }

  const { key, iv } = createSecrets(secret, nonce)

  const decipher = crypto.createDecipheriv('aes-256-ccm', key, iv, {
    authTagLength,
  })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encryptionWithoutNonceAndTag),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

export const defaultGetKey = ({ filename }) => {
  return `${crypto.randomUUID()}-${filename}`
}

/**
 * Our own HttpError in cases where we can't use `got`'s `HTTPError`
 */
export class HttpError extends Error {
  statusCode

  responseJson

  constructor({ statusCode, responseJson }) {
    super(`Request failed with status ${statusCode}`)
    this.statusCode = statusCode
    this.responseJson = responseJson
    this.name = 'HttpError'
  }
}

export const prepareStream = async (stream) =>
  new Promise((resolve, reject) => {
    stream
      .on('response', (response) => {
        const contentLengthStr = response.headers['content-length']
        const contentLength = parseInt(contentLengthStr, 10)
        const size =
          !Number.isNaN(contentLength) && contentLength >= 0
            ? contentLength
            : undefined
        // Don't allow any more data to flow yet.
        // https://github.com/request/request/issues/1990#issuecomment-184712275
        stream.pause()
        resolve({ size })
      })
      .on('error', (err) => {
        // In this case the error object is not a normal GOT HTTPError where json is already parsed,
        // we use our own HttpError error for this scenario.
        if (
          typeof err.response?.body === 'string' &&
          typeof err.response?.statusCode === 'number'
        ) {
          let responseJson
          try {
            responseJson = JSON.parse(err.response.body)
          } catch (_err2) {
            reject(err)
            return
          }

          reject(
            new HttpError({
              statusCode: err.response.statusCode,
              responseJson,
            }),
          )
          return
        }

        reject(err)
      })
  })

export const getBasicAuthHeader = (key, secret) => {
  const base64 = Buffer.from(`${key}:${secret}`, 'binary').toString('base64')
  return `Basic ${base64}`
}

const rfc2047Encode = (dataIn) => {
  const data = `${dataIn}`
  // biome-ignore lint/suspicious/noControlCharactersInRegex: leave it for now
  if (/^[\x00-\x7F]*$/.test(data)) return data // we return ASCII as is
  return `=?UTF-8?B?${Buffer.from(data).toString('base64')}?=` // We encode non-ASCII strings
}

export const rfc2047EncodeMetadata = (metadata) =>
  Object.fromEntries(
    Object.entries(metadata).map((entry) => entry.map(rfc2047Encode)),
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
export const getBucket = ({ bucketOrFn, req, metadata, filename }) => {
  const bucket =
    typeof bucketOrFn === 'function'
      ? bucketOrFn({ req, metadata, filename })
      : bucketOrFn

  if (typeof bucket !== 'string' || bucket === '') {
    // This means a misconfiguration or bug
    throw new TypeError(
      's3: bucket key must be a string or a function resolving the bucket string',
    )
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
export const truncateFilename = (filename, maxFilenameLength) => {
  return filename.slice(maxFilenameLength * -1)
}
